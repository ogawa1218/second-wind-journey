import { NextResponse } from "next/server";
import { assertCronAuth, runInBatches } from "@/lib/cron/auth";
import { getActiveUsers } from "@/lib/users/active-users";
import { generateWeeklyReview } from "@/actions/coach/weekly-review";

/**
 * 毎週日曜 21:00 JST (UTC 12:00) に実行される。
 * 全ユーザーに対し週次レビューの Markdown を生成して保存。
 */
export async function GET(request: Request) {
  const authError = assertCronAuth(request);
  if (authError) return authError;

  const users = await getActiveUsers();

  const result = await runInBatches({
    items: users,
    batchSize: 3, // 週次は Opus 使用で重いので並列度を下げる
    delayMsBetweenBatches: 2000,
    worker: async (user) => {
      await generateWeeklyReview(user.id);
    },
  });

  return NextResponse.json({
    total: users.length,
    success: result.success,
    failed: result.failed,
  });
}
