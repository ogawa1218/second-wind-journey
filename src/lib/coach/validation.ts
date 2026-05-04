/**
 * AI 応答の禁止フレーズ検証
 * 仕様書 v1.1 §3.5
 */

const FORBIDDEN_PATTERNS: RegExp[] = [
  // 「診断」のみ絞り込み（「健診」「再検診」を誤検知しないように）
  /(?<![健再])診断(する|します|です|を下す|を行う)/,
  /(?:薬を|お薬を|医薬品を)(処方|提案)/,
  /(?:を)?服用(してください|しろ)/,
  /お前は無理だ/,
  /諦めろ/,
  /才能がない/,
  // 「危険」「警戒」のリスク評価表現（「不警戒」等は除外）
  /(?<![不])(?:危険|警戒)です/,
];

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateAiResponse(response: string): ValidationResult {
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.test(response)) {
      return { ok: false, reason: p.source };
    }
  }
  return { ok: true };
}
