/**
 * Supabase クライアント & クエリ集
 * Workers 環境: persistSession: false で動作
 */

import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(config) {
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── LINE ユーザー ────────────────────────────────────────────────────────────

export async function getLineUser(db, lineUserId) {
  const { data } = await db
    .from('line_users')
    .select('*, users(*)')
    .eq('line_user_id', lineUserId)
    .maybeSingle();
  return data;
}

export async function upsertLineUser(db, lineUserId, profile) {
  const { data, error } = await db
    .from('line_users')
    .upsert(
      {
        line_user_id: lineUserId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
        language: profile.language ?? 'ja',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'line_user_id', returning: 'representation' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function linkLineUserToAppUser(db, lineUserId, appUserId) {
  const { error } = await db
    .from('line_users')
    .update({ user_id: appUserId, linked_at: new Date().toISOString() })
    .eq('line_user_id', lineUserId);
  if (error) throw error;
}

// ─── 食事ログ ─────────────────────────────────────────────────────────────────

export async function saveFoodLog(db, userId, foodData) {
  const { data, error } = await db
    .from('food_logs')
    .insert({
      user_id: userId,
      meal_type: foodData.mealType,
      image_url: foodData.imageUrl,
      image_hash: foodData.imageHash,
      calories_kcal: foodData.calories,
      protein_g: foodData.protein,
      fat_g: foodData.fat,
      carb_g: foodData.carb,
      fiber_g: foodData.fiber,
      food_name: foodData.foodName,
      ai_raw_response: foodData.aiRaw,
      ai_confidence: foodData.confidence,
      audit_passed: foodData.auditPassed ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFoodLogsByDate(db, userId, date) {
  const startOfDay = `${date}T00:00:00+09:00`;
  const endOfDay = `${date}T23:59:59+09:00`;
  const { data } = await db
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: true });
  return data ?? [];
}

export async function getFoodLogHash(db, imageHash) {
  const { data } = await db
    .from('food_logs')
    .select('id, user_id, logged_at')
    .eq('image_hash', imageHash)
    .maybeSingle();
  return data;
}

// ─── 日次記録 ─────────────────────────────────────────────────────────────────

export async function upsertDailyRecord(db, userId, date, fields) {
  const { data, error } = await db
    .from('daily_records')
    .upsert(
      { user_id: userId, record_date: date, ...fields },
      { onConflict: 'user_id,record_date', returning: 'representation' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRecentDailyRecords(db, userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await db
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .gte('record_date', since.toISOString().slice(0, 10))
    .order('record_date', { ascending: false });
  return data ?? [];
}

// ─── ランデータ ───────────────────────────────────────────────────────────────

export async function upsertRun(db, userId, runData) {
  const { data, error } = await db
    .from('runs')
    .upsert(
      {
        user_id: userId,
        ran_at: runData.ranAt,
        distance_km: runData.distanceKm,
        duration_seconds: runData.durationSeconds,
        avg_heart_rate: runData.avgHeartRate,
        elevation_gain_m: runData.elevationGainM,
        source: runData.source,
        external_id: runData.externalId,
        raw_data: runData.rawData,
      },
      { onConflict: 'user_id,source,external_id', ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getWeeklyRunStats(db, userId) {
  const { data } = await db
    .from('v_weekly_run_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

// ─── ウェアラブルトークン ─────────────────────────────────────────────────────

export async function getWearableToken(db, userId, provider) {
  const { data } = await db
    .from('wearable_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  return data;
}

export async function upsertWearableToken(db, userId, provider, tokenData) {
  const { error } = await db
    .from('wearable_tokens')
    .upsert(
      {
        user_id: userId,
        provider,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expires_at: tokenData.expiresAt,
        scope: tokenData.scope,
        external_user_id: tokenData.externalUserId,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    );
  if (error) throw error;
}

export async function getAllActiveWearableTokens(db) {
  const since = new Date();
  since.setMinutes(since.getMinutes() - 35); // 30 分 + バッファ
  const { data } = await db
    .from('wearable_tokens')
    .select('*, users(id, display_name)')
    .or(`last_synced_at.is.null,last_synced_at.lt.${since.toISOString()}`);
  return data ?? [];
}

// ─── ペナルティ ───────────────────────────────────────────────────────────────

export async function getPenaltyContract(db, userId) {
  const { data } = await db
    .from('penalty_contracts')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();
  return data;
}

export async function upsertPenaltyPoolEntry(db, userId, weekStart, fields) {
  const { data, error } = await db
    .from('penalty_pool_entries')
    .upsert(
      { user_id: userId, week_start_date: weekStart, ...fields },
      { onConflict: 'user_id,week_start_date', returning: 'representation' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPendingPenalties(db, weekStart) {
  const { data } = await db
    .from('penalty_pool_entries')
    .select('*, users(display_name), penalty_contracts(stripe_customer_id, stripe_payment_method)')
    .eq('week_start_date', weekStart)
    .eq('status', 'pending')
    .gt('amount_charged_jpy', 0);
  return data ?? [];
}

// ─── ランキング ───────────────────────────────────────────────────────────────

export async function getWeeklyRanking(db, limit = 20) {
  const { data } = await db
    .from('v_weekly_discipline_score')
    .select('*')
    .limit(limit);
  return data ?? [];
}

// ─── 監査ログ ─────────────────────────────────────────────────────────────────

export async function saveAuditLog(db, auditData) {
  const { error } = await db.from('image_audit_log').insert({
    user_id: auditData.userId,
    food_log_id: auditData.foodLogId,
    image_hash: auditData.imageHash,
    fraud_flags: auditData.fraudFlags,
    fraud_score: auditData.fraudScore,
    exif_timestamp: auditData.exifTimestamp,
    claimed_at: auditData.claimedAt,
    delta_minutes: auditData.deltaMinutes,
    duplicate_of: auditData.duplicateOf,
  });
  if (error) console.error('audit log save error:', error);
}

// ─── AI 会話ログ ──────────────────────────────────────────────────────────────

export async function saveAiConversation(db, userId, entry) {
  const { error } = await db.from('ai_conversations').insert({
    user_id: userId,
    kind: entry.kind,
    role: entry.role,
    content: entry.content,
    context_data: entry.contextData,
    model: entry.model,
    input_tokens: entry.inputTokens,
    output_tokens: entry.outputTokens,
    cost_usd: entry.costUsd,
  });
  if (error) console.error('ai conversation save error:', error);
}
