/**
 * AI コーチに渡す日次コンテキストの構築。
 * 仕様書 v1.1 §1.4「ユーザー文脈」
 */

import { supabaseAdmin } from "@/lib/supabase/server";

export interface DailyContext {
  user: {
    displayName: string | null;
    ageDecimal: number | null;
    gender: string | null;
    coachTone: string;
    targetFullMarathonSeconds: number | null;
  };
  vitality: {
    score: number | null;
    diff: number | null;
    snapshotDate: string | null;
    scoreDelta: number | null;
    reliability: string | null;
  };
  recent: {
    yesterdayRunDistanceKm: number | null;
    yesterdayRunPaceSecPerKm: number | null;
    consecutiveRunDays: number;
    weeklyMetMinutes: number | null;
    avgSleepHours: number | null;
    avgMood: number | null;
    weightKg: number | null;
    weightDiff7d: number | null;
  };
  flags: {
    crisisLocked: boolean;
    onboardingCompleted: boolean;
  };
}

/**
 * 1ユーザー分のコンテキストを並列クエリで構築。
 * 日次のAI生成とチャットの両方で使う。
 */
export async function fetchDailyContext(userId: string): Promise<DailyContext> {
  const [userRes, vitalityRes, weeklyRunRes, dailyRecRes] = await Promise.all([
    supabaseAdmin
      .from("v_user_age")
      .select(
        "display_name, age_decimal, gender, coach_tone, target_full_marathon_seconds, crisis_detected_at, onboarding_completed_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("v_latest_vitality_score")
      .select("vitality_score, diff, snapshot_date, score_delta, reliability")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("v_weekly_run_stats")
      .select(
        "weekly_met_minutes, run_count, run_days, last_ran_at, total_distance_km",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("daily_records")
      .select("record_date, sleep_hours, mood, weight_kg")
      .eq("user_id", userId)
      .order("record_date", { ascending: false })
      .limit(7),
  ]);

  if (userRes.error) throw userRes.error;
  if (vitalityRes.error) throw vitalityRes.error;
  if (weeklyRunRes.error) throw weeklyRunRes.error;
  if (dailyRecRes.error) throw dailyRecRes.error;

  // 直近7日のラン履歴から「昨日のラン」を取得
  const yesterdayRun = await fetchYesterdayRun(userId);

  // 直近7日の集計
  const recent = dailyRecRes.data ?? [];
  const sleepValues = recent.map((r) => r.sleep_hours).filter((v): v is number => v != null);
  const moodValues = recent.map((r) => r.mood).filter((v): v is number => v != null);
  const weightValues = recent
    .map((r) => ({ date: r.record_date, w: r.weight_kg }))
    .filter((r): r is { date: string; w: number } => r.w != null);

  const avgSleepHours = average(sleepValues);
  const avgMood = average(moodValues);
  const latestWeight = weightValues[0]?.w ?? null;
  const oldestWeight = weightValues[weightValues.length - 1]?.w ?? null;
  const weightDiff7d =
    latestWeight != null && oldestWeight != null && weightValues.length >= 2
      ? Number((latestWeight - oldestWeight).toFixed(2))
      : null;

  return {
    user: {
      displayName: userRes.data?.display_name ?? null,
      ageDecimal: userRes.data?.age_decimal ?? null,
      gender: userRes.data?.gender ?? null,
      coachTone: userRes.data?.coach_tone ?? "coach",
      targetFullMarathonSeconds: userRes.data?.target_full_marathon_seconds ?? null,
    },
    vitality: {
      score: vitalityRes.data?.vitality_score ?? null,
      diff: vitalityRes.data?.diff ?? null,
      snapshotDate: vitalityRes.data?.snapshot_date ?? null,
      scoreDelta: vitalityRes.data?.score_delta ?? null,
      reliability: vitalityRes.data?.reliability ?? null,
    },
    recent: {
      yesterdayRunDistanceKm: yesterdayRun?.distance_km ?? null,
      yesterdayRunPaceSecPerKm: yesterdayRun?.avg_pace_seconds_per_km ?? null,
      consecutiveRunDays: weeklyRunRes.data?.run_days ?? 0,
      weeklyMetMinutes: weeklyRunRes.data?.weekly_met_minutes ?? null,
      avgSleepHours,
      avgMood,
      weightKg: latestWeight,
      weightDiff7d,
    },
    flags: {
      crisisLocked: userRes.data?.crisis_detected_at != null,
      onboardingCompleted: userRes.data?.onboarding_completed_at != null,
    },
  };
}

async function fetchYesterdayRun(userId: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStart = new Date(yesterday);
  yStart.setHours(0, 0, 0, 0);
  const yEnd = new Date(yesterday);
  yEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabaseAdmin
    .from("runs")
    .select("distance_km, avg_pace_seconds_per_km, ran_at")
    .eq("user_id", userId)
    .gte("ran_at", yStart.toISOString())
    .lte("ran_at", yEnd.toISOString())
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function average(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2));
}
