/**
 * Anthropic Claude API クライアント
 * 仕様書 v1.1 §3.1
 *
 * - cache_control: ephemeral で BASE_PROMPT をキャッシュ
 * - Context は messages 経由（system に連結しない、cache 効率化のため）
 * - TextBlock 型ガード使用
 */

import Anthropic from "@anthropic-ai/sdk";
import type { TextBlock } from "@anthropic-ai/sdk/resources/messages";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("Missing ANTHROPIC_API_KEY env var");
}

export const anthropic = new Anthropic({ apiKey });

// 仕様書 v1.1 で claude-sonnet-4-7 / claude-opus-4-7 を指定。
// SDK の Model 型に未掲載なら as キャストで通す（実 API は受け付ける）。
export const MODEL_DEFAULT = "claude-sonnet-4-7" as Anthropic.Messages.Model;
export const MODEL_HEAVY = "claude-opus-4-7" as Anthropic.Messages.Model;

export interface CallClaudeArgs {
  systemPrompt: string;
  contextData?: unknown;
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  useHeavyModel?: boolean;
}

export interface CallClaudeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((block): block is TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/**
 * Single Claude API call with caching, history, and context-as-message.
 */
export async function callClaude(args: CallClaudeArgs): Promise<CallClaudeResult> {
  const {
    systemPrompt,
    contextData,
    userMessage,
    conversationHistory = [],
    maxTokens = 500,
    useHeavyModel = false,
  } = args;

  const model = useHeavyModel ? MODEL_HEAVY : MODEL_DEFAULT;

  // Context は messages 配列の冒頭で渡す（system に連結すると毎回 cache 無効化される）
  const messages: Anthropic.Messages.MessageParam[] = [];
  if (contextData !== undefined) {
    messages.push({
      role: "user",
      content: `# Context\n${JSON.stringify(contextData, null, 2)}\n\n（以降はユーザーとの対話）`,
    });
    messages.push({
      role: "assistant",
      content: "了解しました。ユーザーの状況を把握しました。",
    });
  }
  for (const turn of conversationHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({ role: "user", content: userMessage });

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }, // BASE_PROMPT を 5分 TTL でキャッシュ
      },
    ],
    messages,
  });

  return {
    text: extractText(response.content),
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    model,
  };
}
