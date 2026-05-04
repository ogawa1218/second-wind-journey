import { describe, it, expect } from "vitest";
import { runInBatches, assertCronAuth } from "@/lib/cron/auth";

describe("runInBatches", () => {
  it("全成功時は success カウントが正しい", async () => {
    const items = [1, 2, 3, 4, 5];
    const result = await runInBatches({
      items,
      batchSize: 2,
      delayMsBetweenBatches: 0,
      worker: async (n) => n * 2,
    });
    expect(result.success).toBe(5);
    expect(result.failed).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("一部失敗してもバッチ処理は継続する", async () => {
    const items = [1, 2, 3, 4];
    const result = await runInBatches({
      items,
      batchSize: 2,
      delayMsBetweenBatches: 0,
      worker: async (n) => {
        if (n === 2 || n === 4) throw new Error(`fail-${n}`);
        return n;
      },
    });
    expect(result.success).toBe(2);
    expect(result.failed).toBe(2);
    expect(result.errors).toHaveLength(2);
  });

  it("空配列の場合は何もしない", async () => {
    const result = await runInBatches({
      items: [],
      batchSize: 5,
      delayMsBetweenBatches: 1000,
      worker: async (n: number) => n,
    });
    expect(result.success).toBe(0);
    expect(result.failed).toBe(0);
  });
});

describe("assertCronAuth", () => {
  const ORIGINAL_SECRET = process.env.CRON_SECRET;

  it("CRON_SECRET 未設定時は 500", async () => {
    delete process.env.CRON_SECRET;
    const req = new Request("http://test/cron", {
      headers: { authorization: "Bearer x" },
    });
    const res = assertCronAuth(req);
    expect(res?.status).toBe(500);

    if (ORIGINAL_SECRET != null) process.env.CRON_SECRET = ORIGINAL_SECRET;
  });

  it("不正な Authorization ヘッダは 401", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const req = new Request("http://test/cron", {
      headers: { authorization: "Bearer wrong" },
    });
    const res = assertCronAuth(req);
    expect(res?.status).toBe(401);
  });

  it("正しい Authorization ヘッダは null（通過）", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const req = new Request("http://test/cron", {
      headers: { authorization: "Bearer expected-secret" },
    });
    const res = assertCronAuth(req);
    expect(res).toBeNull();
  });

  it("Authorization ヘッダなしは 401", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const req = new Request("http://test/cron");
    const res = assertCronAuth(req);
    expect(res?.status).toBe(401);
  });
});
