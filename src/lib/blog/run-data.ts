export type RunType = "イージー" | "テンポ走" | "閾値走" | "ロング走" | "インターバル" | "MP走";

export interface RunEntry {
  date: string;
  day: number;
  distanceKm: number;
  durationStr: string;
  avgPaceStr: string;
  avgHR: number;
  maxHR: number;
  calories: number;
  elevationGain: number;
  type: RunType;
  memo: string;
  weight?: number;
  sleepH?: number;
  sleepScore?: number;
}

export const DAY1 = new Date("2026-06-12T00:00:00+09:00");
export const RACE_DATE = new Date("2026-11-22T00:00:00+09:00");
export const TOTAL_DAYS = 164;
export const START_WEIGHT = 100;
export const TARGET_WEIGHT = 64;

// Absolute instants (epoch ms) for the fixed JST midnights of Day 1 and race day.
const DAY1_MS = Date.parse("2026-06-12T00:00:00+09:00");
const RACE_MS = Date.parse("2026-11-22T00:00:00+09:00");

/**
 * Epoch ms of JST midnight for the calendar date that `date` falls on *in JST*.
 * Computing from an explicit +09:00 instant makes the result independent of the
 * server's timezone (Vercel runs in UTC), eliminating the off-by-one in Day N.
 */
function jstMidnightMs(date: Date): number {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(date);
  return Date.parse(`${ymd}T00:00:00+09:00`);
}

export function getDayNumber(date: Date = new Date()): number {
  return Math.floor((jstMidnightMs(date) - DAY1_MS) / 86400000) + 1;
}

export function getDaysToRace(date: Date = new Date()): number {
  return Math.round((RACE_MS - jstMidnightMs(date)) / 86400000);
}

export const RUNS: RunEntry[] = [
  {
    date: "2026-06-19",
    day: 8,
    distanceKm: 15.2,
    durationStr: "1:26:08",
    avgPaceStr: "5'40\"",
    avgHR: 147,
    maxHR: 162,
    calories: 950,
    elevationGain: 38,
    type: "イージー",
    memo: "フィリピン出張前最終ラン。脚の感触良好",
    weight: 68.2,
    sleepH: 7.0,
    sleepScore: 81,
  },
  {
    date: "2026-06-18",
    day: 7,
    distanceKm: 15.0,
    durationStr: "1:25:30",
    avgPaceStr: "5'42\"",
    avgHR: 145,
    maxHR: 160,
    calories: 938,
    elevationGain: 35,
    type: "イージー",
    memo: "04:00起床ルーティン機能。心拍安定",
    weight: 68.4,
    sleepH: 7.0,
    sleepScore: 78,
  },
  {
    date: "2026-06-17",
    day: 6,
    distanceKm: 10.0,
    durationStr: "48:32",
    avgPaceStr: "4'51\"",
    avgHR: 162,
    maxHR: 178,
    calories: 672,
    elevationGain: 25,
    type: "テンポ走",
    memo: "初テンポ走。4'51/kmでギリギリ維持。心拍は想定内",
    weight: 68.3,
    sleepH: 7.0,
    sleepScore: 76,
  },
  {
    date: "2026-06-16",
    day: 5,
    distanceKm: 15.0,
    durationStr: "1:26:15",
    avgPaceStr: "5'45\"",
    avgHR: 148,
    maxHR: 163,
    calories: 942,
    elevationGain: 42,
    type: "イージー",
    memo: "03:55起床。少し眠かったが走り出したら快調",
    weight: 68.5,
    sleepH: 6.5,
    sleepScore: 72,
  },
  {
    date: "2026-06-14",
    day: 3,
    distanceKm: 14.0,
    durationStr: "1:20:35",
    avgPaceStr: "5'45\"",
    avgHR: 144,
    maxHR: 158,
    calories: 878,
    elevationGain: 30,
    type: "イージー",
    memo: "2日目より足取りが軽い。有酸素エンジン起動中",
    weight: 68.8,
    sleepH: 7.0,
    sleepScore: 80,
  },
  {
    date: "2026-06-13",
    day: 2,
    distanceKm: 12.0,
    durationStr: "1:10:00",
    avgPaceStr: "5'50\"",
    avgHR: 142,
    maxHR: 155,
    calories: 752,
    elevationGain: 28,
    type: "イージー",
    memo: "継続。no_debt_rule通り上乗せせず12kmを守った",
    weight: 69.0,
    sleepH: 7.0,
    sleepScore: 77,
  },
  {
    date: "2026-06-12",
    day: 1,
    distanceKm: 12.0,
    durationStr: "1:10:48",
    avgPaceStr: "5'54\"",
    avgHR: 140,
    maxHR: 152,
    calories: 748,
    elevationGain: 25,
    type: "イージー",
    memo: "Day 1。退路を断った。サブエガ164日チャレンジ開始",
    weight: 69.2,
    sleepH: 7.0,
    sleepScore: 79,
  },
];

// ---------------------------------------------------------------------------
// Derived single-source-of-truth values (avoid hardcoding these elsewhere)
// ---------------------------------------------------------------------------

/** 最新の体重実測値（RUNS は新しい順。weight を持つ最初の記録から導出） */
export const CURRENT_WEIGHT: number =
  RUNS.find((r) => r.weight != null)?.weight ?? START_WEIGHT;

/** スタートからの減量幅（小数1桁・浮動小数アーティファクト防止） */
export const WEIGHT_LOST: number =
  Math.round((START_WEIGHT - CURRENT_WEIGHT) * 10) / 10;

/** レース目標までの残り体重（小数1桁） */
export const WEIGHT_TO_GO: number =
  Math.round((CURRENT_WEIGHT - TARGET_WEIGHT) * 10) / 10;

// ---------------------------------------------------------------------------
// Shared site metadata constants (single source for titles/descriptions)
// ---------------------------------------------------------------------------

export const SITE_URL = "https://mash-health.vercel.app";
export const SITE_NAME = "MASH サブエガ164日チャレンジ";
export const RACE_NAME = "つくばマラソン2026";
export const GOAL_LABEL = "サブエガ（2時間50分切り）";

/** トップ/レイアウト共通のサイト説明文（現在体重は実データ由来で自動更新） */
export const SITE_DESCRIPTION =
  `元${START_WEIGHT}kg→現在${CURRENT_WEIGHT}kg。2026年11月22日つくばマラソンで` +
  `サブエガ（2時間50分切り）を目指す164日間の記録。`;
