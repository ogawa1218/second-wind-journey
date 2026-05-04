/**
 * 会話履歴のトークン管理 + 要約圧縮
 * 仕様書 v1.1 §3.8
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export const MAX_HISTORY_TOKENS_DEFAULT = 4000;
const TOKEN_PER_CHAR_APPROX = 0.5; // 日本語ざっくり推定

function estimateTokens(turns: ChatTurn[]): number {
  return turns.reduce(
    (sum, m) => sum + m.content.length * TOKEN_PER_CHAR_APPROX,
    0,
  );
}

/**
 * 履歴を上限内に収める。超過時は古い半分を要約に置き換える。
 *
 * `summarize` は呼び出し側が注入する依存（テストでスタブ可能）。
 */
export async function compactHistory(
  history: ChatTurn[],
  maxTokens: number = MAX_HISTORY_TOKENS_DEFAULT,
  summarize?: (oldPart: ChatTurn[]) => Promise<string>,
): Promise<ChatTurn[]> {
  if (estimateTokens(history) <= maxTokens) return history;

  const half = Math.floor(history.length / 2);
  const oldPart = history.slice(0, half);
  const recent = history.slice(half);

  const summary = summarize
    ? await summarize(oldPart)
    : oldPart
        .map((t) => `${t.role}: ${t.content.slice(0, 60)}`)
        .join(" / ");

  return [
    { role: "assistant", content: `（過去の対話の要約: ${summary}）` },
    ...recent,
  ];
}
