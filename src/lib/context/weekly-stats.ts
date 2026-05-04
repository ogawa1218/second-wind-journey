/**
 * 週次レビュー用の集計（直近7日）
 * 仕様書 v1.1 §2.3 C
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export interface WeeklyStats {
  weekStartDate: string; // YYYY-MM-DD（月曜日）
  totalDistanceKm: number;
  totalRuns: number;
  restDays: number;
  avgPaceSecPerKm: number | null;
  bestPaceSecPerKm: number | null;
  bestRunDistanceKm: number | null;
  weightTrendKg: number | null; // 期間中の体重変化
  avgSleepHours: number | null;
  vitalityScoreChange: number | null;
}

/**
 * 直近7日のトレーニング集計を返す。
 * generateWeeklyReview のコンテキスト用。
 */
export async function aggregateWeeklyStats(userId: string): Promise<WeeklyStats> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // 月曜日に揃える（日曜=0、月曜=1）
  const monday = new Date(weekAgo);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const weekStartDate = monday.toISOString().slice(0, 10);

  const [runsRes, weeklyStatsRes, dailyRecRes, vitalityRes] = await Promise.all([
    supabaseAdmin
      .from("runs")
      .select("distance_km, avg_pace_seconds_per_km, ran_at")
      .eq("user_id", userId)
      .gte("ran_at", weekAgo.toISOString())
      .order("distance_km", { ascending: false })
      .limit(1),
    supabaseAdmin
      .from("v_weekly_run_stats")
      .select("run_count, run_days, total_distance_km, avg_pace_seconds_per_km, best_pace_seconds_per_km")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("daily_records")
      .select("record_date, weight_kg, sleep_hours")
      .eq("user_id", userId)
      .gte("record_date", weekAgo.toISOString().slice(0, 10))
      .order("record_date", { ascending: false }),
    supabaseAdmin
      .from("vitality_score_snapshots")
      .select("vitality_score, snapshot_date")
      .eq("user_id", userId)
      .gte("snapshot_date", weekAgo.toISOString().slice(0, 10))
      .order("snapshot_date", { ascending: false }),
  ]);

  if (runsRes.error) throw runsRes.error;
  if (weeklyStatsRes.error) throw weeklyStatsRes.error;
  if (dailyRecRes.error) throw dailyRecRes.error;
  if (vitalityRes.error) throw vitalityRes.error;

  const totalRuns = weeklyStatsRes.data?.run_count ?? 0;
  const runDays = weeklyStatsRes.data?.run_days ?? 0;
  const restDays = Math.max(0, 7 - runDays);

  const dailyRec = dailyRecRes.data ?? [];
  const weights = dailyRec
    .map((r) => r.weight_kg)
    .filter((v): v is number => v != null);
  const sleeps = dailyRec
    .map((r) => r.sleep_hours)
    .filter((v): v is number => v != null);

  const weightTrendKg =
    weights.length >= 2
      ? Number((weights[0] - weights[weights.length - 1]).toFixed(2))
      : null;

  const avgSleepHours =
    sleeps.length > 0
      ? Number((sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(2))
      : null;

  const vitalityRows = vitalityRes.data ?? [];
  const vitalityScoreChange =
    vitalityRows.length >= 2
      ? Number(
          (
            vitalityRows[0].vitality_score - vitalityRows[vitalityRows.length - 1].vitality_score
          ).toFixed(2),
        )
      : null;

  return {
    weekStartDate,
    totalDistanceKm: weeklyStatsRes.data?.total_distance_km ?? 0,
    totalRuns,
    restDays,
    avgPaceSecPerKm: weeklyStatsRes.data?.avg_pace_seconds_per_km ?? null,
    bestPaceSecPerKm: weeklyStatsRes.data?.best_pace_seconds_per_km ?? null,
    bestRunDistanceKm: runsRes.data?.[0]?.distance_km ?? null,
    weightTrendKg,
    avgSleepHours,
    vitalityScoreChange,
  };
}

/**
 * 週次レビューを保存（upsert で冪等）。
 */
export async function saveWeeklyReview(
  userId: string,
  weekStartDate: string,
  markdownContent: string,
  stats: WeeklyStats,
) {
  const { data, error } = await supabaseAdmin
    .from("weekly_reviews")
    .upsert(
      {
        user_id: userId,
        week_start_date: weekStartDate,
        markdown_content: markdownContent,
        stats: stats as unknown as Json,
      },
      { onConflict: "user_id,week_start_date" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
