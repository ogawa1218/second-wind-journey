import { NextResponse } from "next/server";

/**
 * Vercel Cron 認証チェック。
 * `Authorization: Bearer <CRON_SECRET>` を要求する。
 */
export function assertCronAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return new NextResponse(
      JSON.stringify({ error: "CRON_SECRET not configured" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}

interface BatchOptions<T, R> {
  items: T[];
  batchSize: number;
  delayMsBetweenBatches: number;
  worker: (item: T) => Promise<R>;
}

/**
 * Anthropic レート制限を考慮し、N並列ずつバッチ処理する。
 */
export async function runInBatches<T, R>(
  opts: BatchOptions<T, R>,
): Promise<{ success: number; failed: number; errors: unknown[] }> {
  const { items, batchSize, delayMsBetweenBatches, worker } = opts;
  let success = 0;
  let failed = 0;
  const errors: unknown[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(worker));
    for (const r of results) {
      if (r.status === "fulfilled") {
        success += 1;
      } else {
        failed += 1;
        errors.push(r.reason);
      }
    }
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMsBetweenBatches));
    }
  }

  return { success, failed, errors };
}
