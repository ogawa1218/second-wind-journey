/**
 * 希死念慮検知 + ホットライン誘導（v1.1 では骨格のみ、文言は v1.2 で文化監修）
 * 仕様書 v1.1 §3.6
 */

// 「走り」「ランニング」が前後どちらにあっても誤検知を避けるため
// lookbehind と lookahead を両方使う（V8 / Node 18+ で可変長対応）
const CRISIS_PATTERNS: RegExp[] = [
  /消えたい/,
  /死にたい/,
  /生きていたくない/,
  /(?<!ランニング.*)もうやめたい(?!.*ランニング)/,
  /(?<!走り.*)楽になりたい(?!.*走り)/,
];

export function detectCrisis(userMessage: string): string | null {
  for (const p of CRISIS_PATTERNS) {
    if (p.test(userMessage)) return p.source;
  }
  return null;
}

export function getCrisisResponse(): string {
  return [
    "あなたが今しんどい気持ちでいることが伝わってきました。",
    "ひとりで抱えないでほしいです。話を聴いてくれる窓口があります:",
    "",
    "・よりそいホットライン: 0120-279-338（24時間・無料）",
    "・いのちの電話: 0570-783-556",
    "",
    "今夜、走るかどうかは私からは何も言いません。",
    "まず、誰かに話してみませんか。",
  ].join("\n");
}
