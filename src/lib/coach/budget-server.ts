/**
 * 予算チェック（DB 依存、サーバーサイド専用）
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import {
  PER_USER_MONTHLY_USD,
  TOTAL_MONTHLY_USD,
  type BudgetCheckResult,
} from "./budget";

export async function checkBudget(userId: string): Promise<BudgetCheckResult> {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const { data: userRows, error: userErr } = await supabaseAdmin
    .from("ai_conversations")
    .select("cost_usd")
    .eq("user_id", userId)
    .gte("created_at", monthStart)
    .not("cost_usd", "is", null);

  if (userErr) throw userErr;

  const userCostUsd = (userRows ?? []).reduce(
    (sum, r) => sum + (r.cost_usd ?? 0),
    0,
  );

  if (userCostUsd >= PER_USER_MONTHLY_USD) {
    return { ok: false, reason: "user_limit", userCostUsd, globalCostUsd: 0 };
  }

  const { data: globalRows, error: globalErr } = await supabaseAdmin
    .from("ai_conversations")
    .select("cost_usd")
    .gte("created_at", monthStart)
    .not("cost_usd", "is", null);

  if (globalErr) throw globalErr;

  const globalCostUsd = (globalRows ?? []).reduce(
    (sum, r) => sum + (r.cost_usd ?? 0),
    0,
  );

  if (globalCostUsd >= TOTAL_MONTHLY_USD) {
    return { ok: false, reason: "global_limit", userCostUsd, globalCostUsd };
  }

  return { ok: true, userCostUsd, globalCostUsd };
}
