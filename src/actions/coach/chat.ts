"use server";

/**
 * チャット相談 Server Action
 * 仕様書 v1.1 §2.3 B
 */

import { fetchDailyContext } from "@/lib/context/daily-context";
import { buildSystemPrompt, type CoachTone } from "@/lib/coach/prompts";
import { CHAT_PROMPT } from "@/lib/coach/prompts";
import { wrapUserInput } from "@/lib/coach/injection-defense";
import { validateAiResponse } from "@/lib/coach/validation";
import { checkBudget } from "@/lib/coach/budget-server";
import { getBudgetExceededMessage } from "@/lib/coach/budget";
import { callClaude } from "@/lib/coach/client";
import { detectCrisis, getCrisisResponse } from "@/lib/coach/safety";
import { compactHistory, type ChatTurn } from "@/lib/coach/history-manager";
import { saveConversation } from "@/lib/coach/save-conversation";
import { supabaseAdmin } from "@/lib/supabase/server";

const FALLBACK_VALIDATION =
  "うまく伝えきれませんでした。別の聞き方で試してください。";

export interface HandleChatArgs {
  userId: string;
  userMessage: string;
  conversationHistory?: ChatTurn[];
}

export async function handleChat(args: HandleChatArgs): Promise<string> {
  const { userId, userMessage, conversationHistory = [] } = args;

  // 1. 希死念慮検知（最優先、AI 呼び出し前にロック）
  const crisis = detectCrisis(userMessage);
  if (crisis) {
    const response = getCrisisResponse();
    await Promise.all([
      // 該当ユーザーをロック
      supabaseAdmin
        .from("users")
        .update({ crisis_detected_at: new Date().toISOString() })
        .eq("id", userId),
      saveConversation({
        userId,
        kind: "crisis_response",
        role: "user",
        content: userMessage,
        contextData: { matched_pattern: crisis },
      }),
      saveConversation({
        userId,
        kind: "crisis_response",
        role: "assistant",
        content: response,
      }),
    ]);
    return response;
  }

  // 2. 予算チェック
  const budget = await checkBudget(userId);
  if (!budget.ok && budget.reason) {
    return getBudgetExceededMessage(budget.reason);
  }

  // 3. ユーザー入力を保存（AI 呼び出し前）
  await saveConversation({
    userId,
    kind: "chat",
    role: "user",
    content: userMessage,
  });

  const ctx = await fetchDailyContext(userId);
  if (ctx.flags.crisisLocked) {
    return getCrisisResponse();
  }

  const tone = (ctx.user.coachTone ?? "coach") as CoachTone;
  const systemPrompt = buildSystemPrompt(tone, CHAT_PROMPT);

  // 履歴圧縮（4000 トークン上限）
  const compacted = await compactHistory(conversationHistory);

  const { text, inputTokens, outputTokens, model } = await callClaude({
    systemPrompt,
    contextData: ctx,
    userMessage: wrapUserInput(userMessage),
    conversationHistory: compacted,
    maxTokens: 400,
  });

  const validated = validateAiResponse(text);
  const finalText = validated.ok ? text : FALLBACK_VALIDATION;

  await saveConversation({
    userId,
    kind: "chat",
    role: "assistant",
    content: finalText,
    contextData: { tone, validated },
    model,
    inputTokens,
    outputTokens,
  });

  return finalText;
}
