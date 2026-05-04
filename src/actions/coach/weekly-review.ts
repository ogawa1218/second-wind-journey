"use server";

/**
 * 週次レビュー（日曜21時自動生成）Server Action
 * 仕様書 v1.1 §2.3 C
 */

import {
  aggregateWeeklyStats,
  saveWeeklyReview,
} from "@/lib/context/weekly-stats";
import { fetchDailyContext } from "@/lib/context/daily-context";
import { buildSystemPrompt, type CoachTone } from "@/lib/coach/prompts";
import { WEEKLY_REVIEW_PROMPT } from "@/lib/coach/prompts";
import { validateAiResponse } from "@/lib/coach/validation";
import { checkBudget } from "@/lib/coach/budget-server";
import { getBudgetExceededMessage } from "@/lib/coach/budget";
import { callClaude } from "@/lib/coach/client";
import { saveConversation } from "@/lib/coach/save-conversation";

const FALLBACK_VALIDATION =
  "今週のレビューが規定にヒットしました。再生成しています。";

export async function generateWeeklyReview(userId: string): Promise<string> {
  const budget = await checkBudget(userId);
  if (!budget.ok && budget.reason) {
    return getBudgetExceededMessage(budget.reason);
  }

  const [stats, ctx] = await Promise.all([
    aggregateWeeklyStats(userId),
    fetchDailyContext(userId),
  ]);

  if (ctx.flags.crisisLocked) {
    return ""; // ロック中は週次生成も停止
  }

  const tone = (ctx.user.coachTone ?? "coach") as CoachTone;
  const systemPrompt = buildSystemPrompt(tone, WEEKLY_REVIEW_PROMPT);

  // 週次レビューは Opus を使う（重い & 出力品質重視）
  const { text, inputTokens, outputTokens, model } = await callClaude({
    systemPrompt,
    contextData: stats,
    userMessage: "今週のレビューをMarkdownで生成してください。",
    maxTokens: 1500,
    useHeavyModel: true,
  });

  const validated = validateAiResponse(text);
  const finalText = validated.ok ? text : FALLBACK_VALIDATION;

  await Promise.all([
    saveWeeklyReview(userId, stats.weekStartDate, finalText, stats),
    saveConversation({
      userId,
      kind: "weekly_review",
      role: "assistant",
      content: finalText,
      contextData: { stats, tone, validated },
      model,
      inputTokens,
      outputTokens,
    }),
  ]);

  return finalText;
}
