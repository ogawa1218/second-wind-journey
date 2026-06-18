/**
 * Second Wind Journey — Cloudflare Workers メインルーター
 * LINE Webhook / Stripe Webhook / LIFF API
 */

import { getConfig } from './config.js';
import { createSupabaseClient } from './db/supabase.js';
import {
  verifyLineSignature,
  replyMessage,
  pushMessage,
  getLineProfile,
  getImageContent,
  buildTextMessage,
  buildQuickReply,
  buildSleepQuickReply,
  buildWeightQuickReply,
  buildMealTypeQuickReply,
  buildFoodLogFlex,
  buildWeeklyReportFlex,
  buildPenaltyWarningFlex,
  buildWelcomeFlex,
} from './services/line.js';
import { analyzeFoodImage, generateCoachMessage, generateDailyAction, generateWeeklyReview } from './services/ai.js';
import { syncAllWearables } from './services/wearable.js';
import { handleStripeWebhook, processWeeklyPenalties } from './services/stripe.js';
import { renderChartsPage } from './views/d3_charts.js';
import {
  getLineUser,
  upsertLineUser,
  saveFoodLog,
  getFoodLogsByDate,
  upsertDailyRecord,
  getRecentDailyRecords,
  getWeeklyRunStats,
  saveAiConversation,
  getWeeklyRanking,
} from './db/supabase.js';
import { auditFoodImage } from './logics/auditor.js';
import { aggregateDailyPFC, calculateDisciplineScore, projectWeightTrajectory } from './logics/math_engine.js';
import { PFC_TARGET } from './config.js';

// ─── Workers フェッチハンドラ ─────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const config = getConfig(env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://liff.line.me',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      // ── LINE Webhook
      if (request.method === 'POST' && url.pathname === '/webhook') {
        return await handleLineWebhook(request, env, config);
      }

      // ── Stripe Webhook
      if (request.method === 'POST' && url.pathname === '/stripe/webhook') {
        return handleStripeWebhook(request, env, config);
      }

      // ── LIFF チャートページ
      if (url.pathname === '/liff/charts') {
        const db = createSupabaseClient(config);
        return renderChartsPage(request, env, { ...config, _db: db });
      }

      // ── LIFF 用 REST API
      if (url.pathname.startsWith('/api/')) {
        return await handleApiRequest(request, url, env, config);
      }

      return new Response(JSON.stringify({ status: 'ok', service: 'Second Wind Journey' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Unhandled error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  // ── cron トリガー
  async scheduled(event, env, ctx) {
    const config = getConfig(env);
    const db = createSupabaseClient(config);

    if (event.cron === '0 21 * * *') {
      ctx.waitUntil(triggerDailyActions(db, config));
    } else if (event.cron === '0 15 * * 0') {
      ctx.waitUntil(triggerWeeklyReview(db, config));
    } else if (event.cron === '*/30 * * * *') {
      ctx.waitUntil(syncAllWearables(db, config));
    }
  },
};

// ─── LINE Webhook ─────────────────────────────────────────────────────────────

async function handleLineWebhook(request, env, config) {
  const body = await request.text();
  const signature = request.headers.get('x-line-signature') ?? '';

  const valid = await verifyLineSignature(body, signature, config.line.channelSecret);
  if (!valid) return new Response('Unauthorized', { status: 401 });

  const payload = JSON.parse(body);
  const db = createSupabaseClient(config);

  // イベントを並列処理（各イベントの失敗が他に影響しない）
  await Promise.allSettled(
    (payload.events ?? []).map((event) => handleLineEvent(event, db, config)),
  );

  return new Response('OK');
}

async function handleLineEvent(event, db, config) {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  // LINE ユーザーを DB に upsert（未登録でも受け付ける）
  let lineUser = await getLineUser(db, lineUserId);
  if (!lineUser) {
    const profile = await getLineProfile(lineUserId, config).catch(() => ({}));
    lineUser = await upsertLineUser(db, lineUserId, profile);
  }

  const userId = lineUser.user_id; // null の場合はオンボーディング前

  switch (event.type) {
    case 'follow':
      await handleFollow(event, lineUser, db, config);
      break;
    case 'message':
      await handleMessage(event, lineUser, userId, db, config);
      break;
    case 'postback':
      await handlePostback(event, lineUser, userId, db, config);
      break;
  }
}

async function handleFollow(event, lineUser, db, config) {
  const welcomeFlex = buildWelcomeFlex(
    lineUser.display_name ?? 'お前',
    config.app.liffId,
  );
  await replyMessage(event.replyToken, [welcomeFlex], config);
}

async function handleMessage(event, lineUser, userId, db, config) {
  const msg = event.message;

  if (msg.type === 'text') {
    await handleTextMessage(event, lineUser, userId, db, config);
  } else if (msg.type === 'image') {
    await handleImageMessage(event, lineUser, userId, db, config);
  }
}

async function handleTextMessage(event, lineUser, userId, db, config) {
  const text = event.message.text.trim();
  const replyToken = event.replyToken;

  // キーワード分岐（手入力は受け付けるが、選択肢で解決できることはしない）
  if (/^(おはよう|朝|morning)/i.test(text)) {
    await replyMessage(replyToken, [buildSleepQuickReply()], config);
    return;
  }

  if (/^(記録|ログ|food|食事)/i.test(text)) {
    await replyMessage(
      replyToken,
      [buildTextMessage('食事の写真を送ってくれ。AIが解析してPFCを計算する。')],
      config,
    );
    return;
  }

  if (/^(体重|weight)/i.test(text)) {
    await replyMessage(replyToken, [buildWeightQuickReply()], config);
    return;
  }

  if (/^(今週|ランキング|ranking)/i.test(text)) {
    const ranking = await getWeeklyRanking(db, 5);
    await replyMessage(
      replyToken,
      [buildQuickReply(
        `今週のトップ5:${ranking.map((r, i) => `\n${i + 1}. ${r.display_name} ${r.discipline_score}pt`).join('')}`,
        [{ label: '詳細を見る', data: 'view:ranking' }],
      )],
      config,
    );
    return;
  }

  // フリーテキスト → MASHコーチング
  if (userId) {
    const records = await getRecentDailyRecords(db, userId, 7).catch(() => []);
    const runStats = await getWeeklyRunStats(db, userId).catch(() => null);

    const context = {
      weight: records[0]?.weight_kg,
      sleepHours: records[0]?.sleep_hours,
      weeklyRunCount: runStats?.run_count ?? 0,
    };

    const aiResp = await generateCoachMessage(text, context, config);

    await saveAiConversation(db, userId, {
      kind: 'chat',
      role: 'assistant',
      content: aiResp.text,
      contextData: context,
      model: aiResp.model,
      inputTokens: aiResp.inputTokens,
      outputTokens: aiResp.outputTokens,
      costUsd: aiResp.costUsd,
    });

    await replyMessage(replyToken, [buildTextMessage(aiResp.text)], config);
  } else {
    await replyMessage(
      replyToken,
      [buildWelcomeFlex(lineUser.display_name ?? 'お前', config.app.liffId)],
      config,
    );
  }
}

async function handleImageMessage(event, lineUser, userId, db, config) {
  const replyToken = event.replyToken;

  if (!userId) {
    await replyMessage(
      replyToken,
      [buildTextMessage('まず登録を完了してくれ。')],
      config,
    );
    return;
  }

  // 画像取得
  const imageBytes = await getImageContent(event.message.id, config);

  // 監査（重複・EXIF 偽装チェック）
  const audit = await auditFoodImage(imageBytes, userId, db);
  if (!audit.passed) {
    await replyMessage(
      replyToken,
      [buildTextMessage(audit.rejectionReason ?? '画像が不正だ。もう一度送れ。')],
      config,
    );
    return;
  }

  // Gemini で食事解析
  let foodAnalysis;
  try {
    foodAnalysis = await analyzeFoodImage(imageBytes, 'image/jpeg', config);
  } catch (e) {
    console.error('Food analysis error:', e);
    await replyMessage(
      replyToken,
      [buildTextMessage('解析に失敗した。もう一度送ってくれ。')],
      config,
    );
    return;
  }

  // PFC スコア計算
  const pfcResult = calculateDisciplineScore ? null : null; // math_engine で個別に計算
  const pfcScore = computePfcScoreFromAnalysis(foodAnalysis);

  // 食事ログ保存
  const foodLog = await saveFoodLog(db, userId, {
    mealType: foodAnalysis.mealType,
    imageUrl: null, // 実装時は Cloud Storage URL
    imageHash: audit.sha256,
    calories: foodAnalysis.calories,
    protein: foodAnalysis.protein,
    fat: foodAnalysis.fat,
    carb: foodAnalysis.carb,
    fiber: foodAnalysis.fiber,
    foodName: foodAnalysis.foodName,
    aiRaw: foodAnalysis,
    confidence: foodAnalysis.confidence,
    auditPassed: true,
  });

  // Flex Message で返信
  const flex = buildFoodLogFlex(
    {
      ...foodAnalysis,
      pfcScore,
      coachComment: foodAnalysis.coachComment,
    },
    config.app.liffId,
  );

  await replyMessage(replyToken, [flex], config);
}

function computePfcScoreFromAnalysis(analysis) {
  if (!analysis.calories) return 0;
  const { proteinRatio, fatRatio, carbRatio } = PFC_TARGET;
  const totalCal = analysis.protein * 4 + analysis.fat * 9 + analysis.carb * 4;
  if (totalCal === 0) return 0;
  const pR = (analysis.protein * 4) / totalCal;
  const fR = (analysis.fat * 9) / totalCal;
  const cR = (analysis.carb * 4) / totalCal;
  const deviation =
    Math.abs(pR - proteinRatio) * 1.5 +
    Math.abs(fR - fatRatio) +
    Math.abs(cR - carbRatio) * 0.5;
  return Math.max(0, Math.min(100, Math.round(100 - deviation * 200)));
}

async function handlePostback(event, lineUser, userId, db, config) {
  const data = event.postback?.data ?? '';
  const replyToken = event.replyToken;
  const [action, value] = data.split(':');

  switch (action) {
    case 'sleep': {
      const hours = parseFloat(value);
      if (userId) {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
        await upsertDailyRecord(db, userId, today, { sleep_hours: hours });
      }
      await replyMessage(
        replyToken,
        [buildTextMessage(getSleepComment(parseFloat(value)))],
        config,
      );
      break;
    }

    case 'meal': {
      // 食事タイプを KV に一時保存して次の画像送信を待つ
      if (config.kv) {
        await config.kv.put(`meal_type:${lineUser.line_user_id}`, value, { expirationTtl: 300 });
      }
      await replyMessage(
        replyToken,
        [buildTextMessage('食事の写真を送ってくれ。')],
        config,
      );
      break;
    }

    case 'weight': {
      if (value === 'input') {
        await replyMessage(
          replyToken,
          [buildTextMessage('体重を「○○.○」の形式で送ってくれ（例: 72.5）')],
          config,
        );
      }
      break;
    }

    case 'view': {
      if (value === 'ranking') {
        await replyMessage(
          replyToken,
          [
            {
              type: 'flex',
              altText: 'ランキングを開く',
              contents: {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary',
                      color: '#1E1E1E',
                      action: {
                        type: 'uri',
                        label: 'ランキングを見る',
                        uri: `https://liff.line.me/${config.app.liffId}?path=/charts?type=ranking`,
                      },
                    },
                  ],
                },
              },
            },
          ],
          config,
        );
      }
      break;
    }
  }
}

function getSleepComment(hours) {
  if (hours < 6) {
    return `${hours}時間か。睡眠不足だと食欲抑制ホルモン（レプチン）が30%落ちる。今夜は必ず7時間確保しろ。`;
  }
  if (hours < 7) {
    return `${hours}時間。悪くはないが最適じゃない。あと30分早く寝ることから始めろ。`;
  }
  if (hours <= 8.5) {
    return `${hours}時間、完璧だ。その調子で食事管理に移れ。`;
  }
  return `${hours}時間。寝すぎも体内時計を乱す。今日は少し体を動かせ。`;
}

// ─── LIFF 用 REST API ─────────────────────────────────────────────────────────

async function handleApiRequest(request, url, env, config) {
  const db = createSupabaseClient(config);
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://liff.line.me',
    'Content-Type': 'application/json',
  };

  const lineUserId = request.headers.get('x-line-user-id');
  const lineUser = lineUserId ? await getLineUser(db, lineUserId) : null;
  const userId = lineUser?.user_id;

  if (url.pathname === '/api/ranking') {
    const ranking = await getWeeklyRanking(db);
    return new Response(JSON.stringify({ ranking }), { headers: corsHeaders });
  }

  if (url.pathname === '/api/user' && userId) {
    const records = await getRecentDailyRecords(db, userId, 30);
    const runStats = await getWeeklyRunStats(db, userId);
    const foodLogs = await getFoodLogsByDate(
      db,
      userId,
      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }),
    );
    const pfcSummary = aggregateDailyPFC(foodLogs, PFC_TARGET);

    return new Response(
      JSON.stringify({ records, runStats, pfcSummary }),
      { headers: corsHeaders },
    );
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: corsHeaders,
  });
}

// ─── cron ジョブ ──────────────────────────────────────────────────────────────

async function triggerDailyActions(db, config) {
  const { data: users } = await db
    .from('line_users')
    .select('line_user_id, user_id')
    .not('user_id', 'is', null);

  if (!users?.length) return;

  for (const user of users) {
    try {
      const records = await getRecentDailyRecords(db, user.user_id, 7);
      const runStats = await getWeeklyRunStats(db, user.user_id);

      const context = {
        weight: records[0]?.weight_kg,
        sleepHours: records[0]?.sleep_hours,
        weeklyRunCount: runStats?.run_count ?? 0,
      };

      const aiResp = await generateDailyAction(context, config);
      await pushMessage(user.line_user_id, [buildTextMessage(aiResp.text)], config);

      await saveAiConversation(db, user.user_id, {
        kind: 'daily_action',
        role: 'assistant',
        content: aiResp.text,
        contextData: context,
        model: aiResp.model,
        inputTokens: aiResp.inputTokens,
        outputTokens: aiResp.outputTokens,
        costUsd: aiResp.costUsd,
      });
    } catch (e) {
      console.error(`Daily action failed for ${user.line_user_id}:`, e.message);
    }
  }
}

async function triggerWeeklyReview(db, config) {
  const { data: users } = await db
    .from('line_users')
    .select('line_user_id, user_id')
    .not('user_id', 'is', null);

  if (!users?.length) return;

  // ペナルティ処理も週次レビューと同時に実行
  await processWeeklyPenalties(db, config).catch((e) =>
    console.error('Weekly penalty processing error:', e),
  );

  for (const user of users) {
    try {
      const runStats = await getWeeklyRunStats(db, user.user_id);
      const records = await getRecentDailyRecords(db, user.user_id, 7);
      const foodLogs = await db
        .from('food_logs')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('logged_at', new Date(Date.now() - 7 * 86400000).toISOString());

      const avgSleep =
        records.reduce((s, r) => s + (r.sleep_hours ?? 0), 0) / (records.length || 1);

      const disciplineData = calculateDisciplineScore({
        sleep: { avgHours: avgSleep },
        food: { logCount: foodLogs.data?.length ?? 0 },
        exercise: { weeklyRunCount: runStats?.run_count ?? 0 },
      });

      const stats = {
        runCount: runStats?.run_count ?? 0,
        totalDistanceKm: runStats?.total_distance_km ?? 0,
        foodLogCount: foodLogs.data?.length ?? 0,
        avgSleepHours: Math.round(avgSleep * 10) / 10,
        disciplineScore: disciplineData.total,
      };

      const aiResp = await generateWeeklyReview(stats, records, config);
      const flex = buildWeeklyReportFlex(stats, aiResp.text, config.app.liffId);

      await pushMessage(user.line_user_id, [flex], config);
    } catch (e) {
      console.error(`Weekly review failed for ${user.line_user_id}:`, e.message);
    }
  }
}
