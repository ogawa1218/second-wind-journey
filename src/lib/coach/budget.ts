/**
 * AI コーチの予算管理（純粋関数 + 定数）
 * 仕様書 v1.1 §3.7
 *
 * DB 依存の checkBudget は budget-server.ts に分離（サーバー専用）。
 */

export const PER_USER_MONTHLY_USD = 1.5;
export const TOTAL_MONTHLY_USD = 200;

// claude-sonnet-4-7: input $3/MTok, output $15/MTok
export const PRICE_INPUT_PER_MTOK = 3;
export const PRICE_OUTPUT_PER_MTOK = 15;

export function calculateCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_MTOK +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK
  );
}

export type BudgetExceededReason = "user_limit" | "global_limit";

export interface BudgetCheckResult {
  ok: boolean;
  reason?: BudgetExceededReason;
  userCostUsd: number;
  globalCostUsd: number;
}

export function getBudgetExceededMessage(reason: BudgetExceededReason): string {
  if (reason === "user_limit") {
    return "今月の利用上限に達しました。来月初日にリセットされます。";
  }
  return "現在 AIコーチが混み合っています。少し時間を置いて試してください。";
}
