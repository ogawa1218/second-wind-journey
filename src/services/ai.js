/**
 * Gemini 1.5 Pro (画像解析) + Claude Sonnet (兄貴肌コーチング)
 * MASH: 元100kgの生還者。共感→冷徹ロジックで退路を断つ。
 */

// ─── MASH システムプロンプト ──────────────────────────────────────────────────

const MASH_BASE_PROMPT = `あなたは「MASH」。これが俺のすべてだ。

# 俺の背景
- 38歳。最重量100kg、健診E判定の地獄を経験した
- 28kgの減量（100kg→72kg）を達成し、毎朝3:45起床・20km激走するシリアスランナー
- 「意志力じゃなく、仕組みで変える」が哲学。言い訳の構造を熟知している

# 鉄の序列（絶対に逸脱しない）
睡眠 → 食事 → 運動。この順番を崩す奴は必ず失敗する。

# 対話スタイル
- まず「わかるぞ」と圧倒的に共感する（1-2文）
- 次の瞬間、冷徹なデータ・ロジックで退路を断つ（1-2文）
- 一人称「俺」、二人称「お前」
- 語尾「だ」「ぞ」「な」「だろ」
- 150字以内。長文説教禁止
- 提案は1つだけ

# 禁止事項
- 医療診断・処方の提案 → 「医者に行け」の一言で切る
- 「無理だ」「才能がない」など完全否定
- 抽象論・精神論のみの返答
- 絵文字（男気）`;

const MASH_FOOD_ANALYSIS_PROMPT = `今回のタスク: 食事画像を解析しろ。

以下を JSON で出力する。余計な説明は不要だ。

{
  "foodName": "料理名（日本語）",
  "calories": 数値（kcal）,
  "protein": 数値（g）,
  "fat": 数値（g）,
  "carb": 数値（g）,
  "fiber": 数値（g）または null,
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "confidence": 0.0〜1.0,
  "coachComment": "MASHとして150字以内の短いコメント（PFC観点で一言）"
}

不明な場合は推定値を入れる。絶対に JSON 以外を返すな。`;

// ─── Gemini 食事画像解析 ──────────────────────────────────────────────────────

export async function analyzeFoodImage(imageBytes, mimeType, config) {
  const base64 = bytesToBase64(imageBytes);

  const body = {
    contents: [
      {
        parts: [
          { text: MASH_FOOD_ANALYSIS_PROMPT },
          { inlineData: { mimeType: mimeType ?? 'image/jpeg', data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${config.gemini.visionEndpoint}?key=${config.gemini.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
}

// ─── Claude コーチングメッセージ ─────────────────────────────────────────────

export async function generateCoachMessage(userMessage, contextData, config) {
  const contextBlock = buildContextBlock(contextData);
  const systemPrompt = `${MASH_BASE_PROMPT}\n\n${contextBlock}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.anthropic.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `<user_input>${userMessage}</user_input>`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text ?? '';

  return {
    text: content,
    model: data.model,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    costUsd: calcAnthropicCost(data.usage, config.anthropic.model),
  };
}

export async function generateDailyAction(contextData, config) {
  const taskPrompt = `今日1日の「最初の1アクション」を1つだけ出せ。
形式: 「[短い挨拶]、[具体的アクション]。」
80字以内。データに基づいた具体的な数値を入れろ。`;

  return generateCoachMessage(taskPrompt, contextData, {
    ...config,
    anthropic: { ...config.anthropic, maxTokens: 256 },
  });
}

export async function generateWeeklyReview(stats, recentRecords, config) {
  const userMessage = `週次レビューを生成しろ。

## データ
ランニング: ${stats.runCount ?? 0}回 / ${stats.totalDistanceKm ?? 0}km
食事ログ: ${stats.foodLogCount ?? 0}件
平均睡眠: ${stats.avgSleepHours ?? 0}時間
規律スコア: ${stats.disciplineScore ?? 0}/100

## 形式（Markdown）
## 今週のサマリー
[数値総括]

## よくやった
[良かった点1つ]

## 退路を断つ
[改善1点、冷徹に]

## 来週の1アクション
[具体的に1つ]

500字以内。MASHの口調で。`;

  return generateCoachMessage(userMessage, {}, {
    ...config,
    anthropic: { ...config.anthropic, maxTokens: 800 },
  });
}

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function buildContextBlock(ctx) {
  if (!ctx || Object.keys(ctx).length === 0) return '';
  const lines = ['# 現在のユーザーデータ（参考）'];
  if (ctx.weight) lines.push(`体重: ${ctx.weight}kg`);
  if (ctx.sleepHours) lines.push(`昨夜の睡眠: ${ctx.sleepHours}時間`);
  if (ctx.todayCalories) lines.push(`今日の摂取カロリー: ${ctx.todayCalories}kcal`);
  if (ctx.weeklyRunCount !== undefined) lines.push(`今週のラン: ${ctx.weeklyRunCount}回`);
  if (ctx.disciplineScore !== undefined) lines.push(`規律スコア: ${ctx.disciplineScore}/100`);
  return lines.join('\n');
}

function calcAnthropicCost(usage, model) {
  if (!usage) return 0;
  // claude-sonnet-4-x: $3/MTok input, $15/MTok output
  const inputRate = model.includes('opus') ? 15 : 3;
  const outputRate = model.includes('opus') ? 75 : 15;
  return (
    (usage.input_tokens * inputRate + usage.output_tokens * outputRate) / 1_000_000
  );
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
