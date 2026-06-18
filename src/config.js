/**
 * 環境変数・定数管理
 * Cloudflare Workers: env はリクエストごとに fetch(request, env) で渡される
 */

export function getConfig(env) {
  return {
    app: {
      env: env.APP_ENV ?? 'development',
      liffId: env.LIFF_ID,
    },
    line: {
      channelSecret: env.LINE_CHANNEL_SECRET,
      channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
      apiBase: 'https://api.line.me/v2/bot',
    },
    supabase: {
      url: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: 'claude-sonnet-4-6',
      maxTokens: 512,
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
      model: 'gemini-1.5-pro',
      visionEndpoint:
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    },
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      apiBase: 'https://api.stripe.com/v1',
      currency: 'jpy',
    },
    fitbit: {
      clientId: env.FITBIT_CLIENT_ID,
      clientSecret: env.FITBIT_CLIENT_SECRET,
      tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
      apiBase: 'https://api.fitbit.com/1',
    },
    garmin: {
      consumerKey: env.GARMIN_CONSUMER_KEY,
      consumerSecret: env.GARMIN_CONSUMER_SECRET,
      apiBase: 'https://apis.garmin.com/wellness-api/rest',
    },
    kv: env.KV_SESSION,
  };
}

// 行動序列ドミノ定数: 睡眠 → 食事 → 運動（絶対順序）
export const DISCIPLINE_WEIGHTS = {
  sleep: 0.30,
  food: 0.30,
  exercise: 0.40,
};

export const IDEAL_SLEEP_HOURS = 7.5;
export const IDEAL_FOOD_LOGS_PER_DAY = 3;
export const IDEAL_WEEKLY_RUNS = 3;

// PFC 目標比率（減量フェーズ）
export const PFC_TARGET = {
  proteinRatio: 0.30, // 30%
  fatRatio: 0.25,     // 25%
  carbRatio: 0.45,    // 45%
  caloriesPerGram: { protein: 4, fat: 9, carb: 4 },
};

// ペナルティ上限（月次）
export const PENALTY_MONTHLY_CAP_JPY = 10_000;

// LIFFコールバックURL
export const LIFF_CHART_PATHS = {
  weight: '/liff/charts?type=weight',
  pace: '/liff/charts?type=pace',
  ranking: '/liff/charts?type=ranking',
};
