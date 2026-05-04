"use server";

/**
 * 朝の「今日の1アクション」自動生成 Server Action
 * 仕様書 v1.1 §2.3 A
 */

import { fetchDailyContext } from "@/lib/context/daily-context";
import { buildSystemPrompt, type CoachTone } from "@/lib/coach/prompts";
import { DAILY_ACTION_PROMPT } from "@/lib/coach/prompts";
import { wrapUserInput } from "@/lib/coach/injection-defense";
import { validateAiResponse } from "@/lib/coach/validation";
import { checkBudget } from "@/lib/coach/budget-server";
import { getBudgetExceededMessage } from "@/lib/coach/budget";
import { callClaude } from "@/lib/coach/client";
import { saveConversation } from "@/lib/coach/save-conversation";

const FALLBACK_BUSY = "今日の1アクションを準備しています。少し待ってから開いてみてください。";

export async function generateDailyAction(userId: string): Promise<string> {
  const budget = await checkBudget(userId);
  if (!budget.ok && budget.reason) {
    return getBudgetExceededMessage(budget.reason);
  }

  const ctx = await fetchDailyContext(userId);

  // 希死念慮ロック中は AI 生成をスキップ
  if (ctx.flags.crisisLocked) {
    return ""; // UI 側で別途対応
  }

  const tone = (ctx.user.coachTone ?? "coach") as CoachTone;
  const systemPrompt = buildSystemPrompt(tone, DAILY_ACTION_PROMPT);

  const { text, inputTokens, outputTokens, model } = await callClaude({
    systemPrompt,
    contextData: ctx,
    userMessage: wrapUserInput("今日の1アクションを提示してください。"),
    maxTokens: 200,
  });

  // 禁止フレーズ検証 → ヒット時はフォールバック
  const validated = validateAiResponse(text);
  const finalText = validated.ok ? text : FALLBACK_BUSY;

  await saveConversation({
    userId,
    kind: "daily_action",
    role: "assistant",
    content: finalText,
    contextData: { tone, validated },
    model,
    inputTokens,
    outputTokens,
  });

  return finalText;
}
