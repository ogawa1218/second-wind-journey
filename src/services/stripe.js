/**
 * Stripe — ペナルティ決済・プール金分配処理
 * SDK は Workers 非対応のため fetch ベースで実装
 */

import {
  getPendingPenalties,
  upsertPenaltyPoolEntry,
  getWeeklyRanking,
} from '../db/supabase.js';
import { PENALTY_MONTHLY_CAP_JPY } from '../config.js';

// ─── Stripe REST ラッパー ─────────────────────────────────────────────────────

async function stripePost(path, params, config) {
  const res = await fetch(`${config.stripe.apiBase}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.stripe.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(flattenParams(params)),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path} error: ${data.error?.message ?? res.status}`);
  return data;
}

async function stripeGet(path, config) {
  const res = await fetch(`${config.stripe.apiBase}${path}`, {
    headers: { Authorization: `Bearer ${config.stripe.secretKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe GET ${path}: ${data.error?.message ?? res.status}`);
  return data;
}

// Stripe のパラメータはネストをアンダースコアで展開する
function flattenParams(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && v !== undefined) {
      if (typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(result, flattenParams(v, key));
      } else {
        result[key] = String(v);
      }
    }
  }
  return result;
}

// ─── 顧客管理 ─────────────────────────────────────────────────────────────────

export async function createStripeCustomer(email, displayName, config) {
  return stripePost(
    '/customers',
    { email, name: displayName, metadata: { source: 'second-wind-journey' } },
    config,
  );
}

export async function createSetupIntent(customerId, config) {
  return stripePost(
    '/setup_intents',
    {
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    },
    config,
  );
}

// ─── ペナルティ決済 ───────────────────────────────────────────────────────────

export async function chargeWeeklyPenalty(penaltyEntry, config) {
  const { users: user, penalty_contracts: contract } = penaltyEntry;
  if (!contract?.stripe_customer_id || !contract?.stripe_payment_method) {
    console.warn(`No Stripe method for user ${penaltyEntry.user_id}`);
    return null;
  }
  if (penaltyEntry.amount_charged_jpy <= 0) return null;

  // 月次上限チェック（簡易: 今月のチャージ合計を事前に確認するとよい）
  const amount = Math.min(penaltyEntry.amount_charged_jpy, PENALTY_MONTHLY_CAP_JPY);

  const pi = await stripePost(
    '/payment_intents',
    {
      amount,
      currency: config.stripe.currency,
      customer: contract.stripe_customer_id,
      payment_method: contract.stripe_payment_method,
      off_session: true,
      confirm: true,
      description: `Second Wind Journey ペナルティ ${penaltyEntry.week_start_date}`,
      metadata: {
        user_id: penaltyEntry.user_id,
        week_start_date: penaltyEntry.week_start_date,
        missed_runs: String(penaltyEntry.missed_runs),
      },
    },
    config,
  );

  return pi;
}

// ─── 週次ペナルティ一括処理（cron エントリポイント） ─────────────────────────

export async function processWeeklyPenalties(db, config) {
  const weekStart = getPreviousMonday();
  const pending = await getPendingPenalties(db, weekStart);

  let totalCharged = 0;
  let totalFailed = 0;

  for (const entry of pending) {
    try {
      const pi = await chargeWeeklyPenalty(entry, config);
      await upsertPenaltyPoolEntry(db, entry.user_id, weekStart, {
        stripe_payment_intent: pi?.id,
        status: pi?.status === 'succeeded' ? 'paid' : 'pending',
      });
      if (pi?.status === 'succeeded') totalCharged += entry.amount_charged_jpy;
    } catch (e) {
      console.error(`Penalty charge failed for ${entry.user_id}:`, e.message);
      totalFailed++;
    }
  }

  if (totalCharged > 0) {
    await distributePoolToWinners(db, weekStart, totalCharged, config);
  }

  return { totalCharged, totalFailed, pending: pending.length };
}

// ─── プール金分配（上位者に Stripe Connect で送金） ──────────────────────────

export async function distributePoolToWinners(db, weekStart, totalPoolJpy, config) {
  const ranking = await getWeeklyRanking(db, 3); // 上位3名
  if (ranking.length === 0) return;

  const shares = [0.5, 0.3, 0.2]; // 1位50% / 2位30% / 3位20%
  for (let i = 0; i < Math.min(ranking.length, shares.length); i++) {
    const winner = ranking[i];
    const amount = Math.floor(totalPoolJpy * shares[i]);
    if (amount < 50) continue; // Stripe 最低送金額

    try {
      // Stripe Connect の transfer (要: connected_account)
      await stripePost(
        '/transfers',
        {
          amount,
          currency: config.stripe.currency,
          destination: winner.stripe_connect_id ?? 'skipped', // 未連携の場合はスキップ
          description: `Second Wind Journey 報酬 ${weekStart} 第${i + 1}位`,
          metadata: { user_id: winner.user_id, rank: String(i + 1), week: weekStart },
        },
        config,
      );
    } catch (e) {
      console.error(`Transfer failed for rank ${i + 1}:`, e.message);
    }
  }

  // 分配済みマーク
  await db
    .from('penalty_pool_entries')
    .update({ status: 'distributed', distributed_at: new Date().toISOString() })
    .eq('week_start_date', weekStart)
    .eq('status', 'paid');
}

// ─── Stripe Webhook 署名検証 ──────────────────────────────────────────────────

export async function verifyStripeWebhook(body, signatureHeader, webhookSecret) {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('=')),
  );
  const ts = parts.t;
  const sig = parts.v1;
  const payload = `${ts}.${body}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return computed === sig;
}

export async function handleStripeWebhook(request, env, config) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';
  const valid = await verifyStripeWebhook(body, sig, config.stripe.webhookSecret);
  if (!valid) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(body);
  console.log(`Stripe webhook: ${event.type}`);

  // payment_intent.succeeded は processWeeklyPenalties で管理するため基本は no-op
  return new Response('OK');
}

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function getPreviousMonday() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 直近月曜
  d.setDate(d.getDate() - 7); // さらに先週の月曜
  return d.toISOString().slice(0, 10);
}
