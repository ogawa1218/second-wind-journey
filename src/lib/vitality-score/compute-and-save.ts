/**
 * 直近データから Vitality Score を算出し、スナップショットとして保存する。
 * 朝の cron で日次実行する想定。
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import { calculateVitalityScore } from "./index";
import { saveVitalityScoreSnapshot } from "./repository";
import type { BehaviorData, CheckupData, Gender, VitalityScoreResult } from "./types";

export interface ComputeAndSaveOptions {
  userId: string;
  /** YYYY-MM-DD。省略時は今日（UTC基準）。 */
  snapshotDate?: string;
}

/**
 * ユーザーの直近データから Vitality Score を計算し、snapshot を保存する。
 * 必須データ（身長・性別・生年月日）が欠けている場合は VitalityScoreInputError が throw される。
 */
export async function computeAndSaveVitalityScore(
  opts: ComputeAndSaveOptions,
): Promise<VitalityScoreResult> {
  const { userId } = opts;
  const snapshotDate = opts.snapshotDate ?? new Date().toISOString().slice(0, 10);

  const behavior = await buildBehaviorData(userId);
  const checkup = await buildCheckupData(userId);

  const result = calculateVitalityScore(behavior, checkup);
  await saveVitalityScoreSnapshot(userId, snapshotDate, result);
  return result;
}

async function buildBehaviorData(userId: string): Promise<BehaviorData> {
  // ユーザープロフィール（age, gender, height）
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("v_user_age")
    .select("age_decimal, gender, height_cm")
    .eq("id", userId)
    .single();
  if (pErr) throw pErr;
  if (profile.age_decimal == null || profile.gender == null || profile.height_cm == null) {
    throw new Error("Profile incomplete: age_decimal / gender / height_cm required");
  }

  // 直近のデイリー記録（体重・体脂肪・RHR・睡眠）
  const { data: latestDaily, error: dErr } = await supabaseAdmin
    .from("daily_records")
    .select("weight_kg, body_fat_percent, resting_heart_rate")
    .eq("user_id", userId)
    .not("weight_kg", "is", null)
    .order("record_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dErr) throw dErr;
  if (!latestDaily?.weight_kg) {
    throw new Error("No weight record available");
  }

  // 直近7日の睡眠平均
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: sleepRows, error: sErr } = await supabaseAdmin
    .from("daily_records")
    .select("sleep_hours")
    .eq("user_id", userId)
    .gte("record_date", sevenDaysAgo.toISOString().slice(0, 10))
    .not("sleep_hours", "is", null);
  if (sErr) throw sErr;
  const sleepValues = (sleepRows ?? [])
    .map((r) => r.sleep_hours)
    .filter((v): v is number => v != null);
  const avgSleepHours =
    sleepValues.length > 0
      ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
      : 7; // デフォルト 7h（標準範囲、validateBehaviorInput を通すため）

  // 直近7日の MET-min 合計
  const { data: weeklyStats, error: wErr } = await supabaseAdmin
    .from("v_weekly_run_stats")
    .select("weekly_met_minutes")
    .eq("user_id", userId)
    .maybeSingle();
  if (wErr) throw wErr;
  const weeklyMetMinutes = weeklyStats?.weekly_met_minutes ?? 0;

  // RHR は users.profile か daily_records.resting_heart_rate
  const restingHeartRate = latestDaily.resting_heart_rate ?? 65; // デフォルト

  return {
    age: profile.age_decimal,
    gender: profile.gender as Gender,
    heightCm: profile.height_cm,
    weightKg: latestDaily.weight_kg,
    restingHeartRate,
    avgSleepHours,
    weeklyMetMinutes,
    bodyFatPercent: latestDaily.body_fat_percent ?? undefined,
  };
}

async function buildCheckupData(userId: string): Promise<CheckupData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("checkup_results")
    .select("hba1c, ldl, hdl, triglyceride, systolic_bp")
    .eq("user_id", userId)
    .order("examined_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  return {
    hba1c: data.hba1c ?? undefined,
    ldl: data.ldl ?? undefined,
    hdl: data.hdl ?? undefined,
    triglyceride: data.triglyceride ?? undefined,
    systolicBp: data.systolic_bp ?? undefined,
  };
}
