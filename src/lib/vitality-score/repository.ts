import { supabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { VitalityScoreResult } from "./types";

type SnapshotInsert = Database["public"]["Tables"]["vitality_score_snapshots"]["Insert"];
type SnapshotRow = Database["public"]["Tables"]["vitality_score_snapshots"]["Row"];

/**
 * Save a Vitality Score result as a daily snapshot.
 * Idempotent on (user_id, snapshot_date) — uses upsert.
 */
export async function saveVitalityScoreSnapshot(
  userId: string,
  snapshotDate: string, // YYYY-MM-DD
  result: VitalityScoreResult,
): Promise<SnapshotRow> {
  const payload: SnapshotInsert = {
    user_id: userId,
    snapshot_date: snapshotDate,
    vitality_score: result.vitalityScore,
    chronological_age: result.chronologicalAge,
    diff: result.diff,
    clipped: result.clipped,
    layer1_score: result.layer1Score,
    layer2_score: result.layer2Score,
    breakdown: result.breakdown as unknown as Database["public"]["Tables"]["vitality_score_snapshots"]["Insert"]["breakdown"],
    reliability: result.reliability,
  };

  const { data, error } = await supabaseAdmin
    .from("vitality_score_snapshots")
    .upsert(payload, { onConflict: "user_id,snapshot_date" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch the latest Vitality Score snapshot for a user (for home screen display).
 */
export async function getLatestVitalityScore(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("v_latest_vitality_score")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
