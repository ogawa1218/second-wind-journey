import { NextResponse } from "next/server";
import { assertCronAuth, runInBatches } from "@/lib/cron/auth";
import { getActiveUsers } from "@/lib/users/active-users";
import { computeAndSaveVitalityScore } from "@/lib/vitality-score/compute-and-save";
import { generateDailyAction } from "@/actions/coach/daily-action";

/**
 * 毎朝 06:00 JST (UTC 21:00) に実行される。
 * 全ユーザーに対し:
 *   1. Vitality Score を再計算してスナップショット保存
 *   2. AI コーチの今日の1アクションを生成
 */
export async function GET(request: Request) {
  const authError = assertCronAuth(request);
  if (authError) return authError;

  const users = await getActiveUsers();

  const result = await runInBatches({
    items: users,
    batchSize: 5,
    delayMsBetweenBatches: 1000,
    worker: async (user) => {
      // Vitality Score を先に更新（コンテキストに反映するため）
      await computeAndSaveVitalityScore({ userId: user.id }).catch(() => {
        // データ不足等は静かに飛ばし、AIコーチだけ動かす
      });
      await generateDailyAction(user.id);
    },
  });

  return NextResponse.json({
    total: users.length,
    success: result.success,
    failed: result.failed,
  });
}
