/**
 * Math.js を使用した PFC・規律スコアリング計算
 * 行動序列ドミノ: 睡眠(30pt) → 食事(30pt) → 運動(40pt) = 100pt
 */

import { create, all } from 'mathjs';

const math = create(all);

// ─── PFC 計算 ─────────────────────────────────────────────────────────────────

/**
 * PFC 実績と目標比率のスコアを算出する（0-100）
 * @param {object} actual - { calories, proteinG, fatG, carbG }
 * @param {object} target - { proteinRatio, fatRatio, carbRatio } (合計 = 1.0)
 * @returns {object} PFC分析結果
 */
export function calculatePFCScore(actual, target) {
  const { calories, proteinG, fatG, carbG } = actual;
  const { proteinRatio, fatRatio, carbRatio } = target;

  if (!calories || calories <= 0) {
    return { score: 0, actualRatios: null, deviations: null, grade: 'F' };
  }

  // 実績カロリー内訳（Math.js evaluate で計算）
  const proteinCal = math.evaluate('p * 4', { p: proteinG });
  const fatCal = math.evaluate('f * 9', { f: fatG });
  const carbCal = math.evaluate('c * 4', { c: carbG });
  const totalMacrosCal = math.evaluate('a + b + c', { a: proteinCal, b: fatCal, c: carbCal });

  const actualRatios = {
    protein: math.round(math.divide(proteinCal, totalMacrosCal), 3),
    fat: math.round(math.divide(fatCal, totalMacrosCal), 3),
    carb: math.round(math.divide(carbCal, totalMacrosCal), 3),
  };

  // 目標との偏差（絶対値）
  const deviations = {
    protein: math.abs(math.subtract(actualRatios.protein, proteinRatio)),
    fat: math.abs(math.subtract(actualRatios.fat, fatRatio)),
    carb: math.abs(math.subtract(actualRatios.carb, carbRatio)),
  };

  // 偏差の重み付きペナルティ（タンパク質不足が最も重い）
  const penalty = math.evaluate(
    'p * 1.5 + f * 1.0 + c * 0.5',
    { p: deviations.protein, f: deviations.fat, c: deviations.carb },
  );

  // スコア: 100点から偏差ペナルティを差し引く（最低0）
  const rawScore = math.max(0, math.evaluate('100 - penalty * 200', { penalty }));
  const score = Math.round(math.min(100, rawScore));

  return {
    score,
    actualRatios,
    deviations,
    proteinG,
    fatG,
    carbG,
    calories,
    grade: scoreToGrade(score),
  };
}

/**
 * 日次の PFC 合計を集計する
 * @param {Array} foodLogs - 当日の food_logs レコード群
 * @param {object} target
 */
export function aggregateDailyPFC(foodLogs, target) {
  const totals = foodLogs.reduce(
    (acc, log) => ({
      calories: math.add(acc.calories, log.calories_kcal ?? 0),
      proteinG: math.add(acc.proteinG, log.protein_g ?? 0),
      fatG: math.add(acc.fatG, log.fat_g ?? 0),
      carbG: math.add(acc.carbG, log.carb_g ?? 0),
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbG: 0 },
  );

  return calculatePFCScore(totals, target);
}

// ─── 規律スコア ───────────────────────────────────────────────────────────────

/**
 * 週次規律スコアを算出する（0-100）
 * 睡眠30pt + 食事30pt + 運動40pt
 */
export function calculateDisciplineScore({ sleep, food, exercise }) {
  const sleepScore = math.round(
    math.min(30, math.evaluate('(h / ideal) * 30', {
      h: sleep.avgHours ?? 0,
      ideal: 7.5,
    })),
    2,
  );

  const foodScore = math.round(
    math.min(30, math.evaluate('(logs / target) * 30', {
      logs: food.logCount ?? 0,
      target: 21, // 3食 × 7日
    })),
    2,
  );

  const exerciseScore = math.round(
    math.min(40, math.evaluate('(runs / target) * 40', {
      runs: exercise.weeklyRunCount ?? 0,
      target: 3,
    })),
    2,
  );

  const total = Math.round(
    math.evaluate('s + f + e', { s: sleepScore, f: foodScore, e: exerciseScore }),
  );

  return {
    total: math.min(100, total),
    breakdown: {
      sleep: { score: sleepScore, max: 30, avgHours: sleep.avgHours },
      food: { score: foodScore, max: 30, logCount: food.logCount },
      exercise: { score: exerciseScore, max: 40, runCount: exercise.weeklyRunCount },
    },
    grade: scoreToGrade(total),
    dominoStatus: checkDominoStatus(sleep, food, exercise),
  };
}

/**
 * 行動序列ドミノのチェック（睡眠が崩れると食事・運動も崩れる）
 */
function checkDominoStatus(sleep, food, exercise) {
  const issues = [];

  const sleepOk = (sleep.avgHours ?? 0) >= 6.5;
  const foodOk = (food.logCount ?? 0) >= 14; // 1日2食以上記録
  const exerciseOk = (exercise.weeklyRunCount ?? 0) >= 2;

  if (!sleepOk) {
    issues.push({
      layer: 'sleep',
      message: `平均睡眠${(sleep.avgHours ?? 0).toFixed(1)}時間。睡眠が崩れると食欲制御ホルモンが狂う。まずここだ。`,
    });
  }
  if (!foodOk && sleepOk) {
    issues.push({
      layer: 'food',
      message: `食事ログ${food.logCount ?? 0}件。記録しない食事は存在しない食事と同じだ。`,
    });
  }
  if (!exerciseOk && sleepOk && foodOk) {
    issues.push({
      layer: 'exercise',
      message: `週${exercise.weeklyRunCount ?? 0}回ラン。基礎代謝が落ちていく。今週あと${3 - (exercise.weeklyRunCount ?? 0)}回走れ。`,
    });
  }

  return { allGreen: issues.length === 0, issues };
}

// ─── 未来予測（残酷な可視化用） ──────────────────────────────────────────────

/**
 * 現在のペースが続いた場合の体重推移を予測する
 * @param {object} current - { weightKg, weeklyRunKm, dailyCalories, age, heightCm, gender }
 * @param {number} days - 予測日数
 * @returns {Array<{day: number, weightKg: number}>} 予測データ点
 */
export function projectWeightTrajectory(current, days = 365) {
  const { weightKg, weeklyRunKm, dailyCalories, age, heightCm, gender } = current;

  // Harris-Benedict BMR
  const bmr =
    gender === 'female'
      ? math.evaluate('10*w + 6.25*h - 5*a - 161', { w: weightKg, h: heightCm, a: age })
      : math.evaluate('10*w + 6.25*h - 5*a + 5', { w: weightKg, h: heightCm, a: age });

  // 活動係数（週km → 運動消費カロリー/日の近似）
  const activityCalPerDay = math.evaluate('km / 7 * 60', { km: weeklyRunKm ?? 0 });
  const tdee = math.evaluate('bmr * 1.2 + act', { bmr, act: activityCalPerDay });

  // 1日の余剰/不足カロリー
  const dailyBalance = math.evaluate('intake - tdee', {
    intake: dailyCalories ?? 2000,
    tdee,
  });

  // 7000 kcal ≒ 1 kg 体重変化（近似）
  const weightChangePerDay = math.divide(dailyBalance, 7000);

  const points = [];
  const step = Math.max(1, Math.round(days / 52)); // 週次データ点
  for (let d = 0; d <= days; d += step) {
    const projected = math.round(
      math.add(weightKg, math.multiply(weightChangePerDay, d)),
      1,
    );
    points.push({ day: d, weightKg: Math.max(40, Number(projected)) });
  }

  const finalWeight = points[points.length - 1].weightKg;
  const bmi = math.round(math.divide(finalWeight, math.pow(heightCm / 100, 2)), 1);

  return {
    points,
    summary: {
      currentWeightKg: weightKg,
      projectedWeightKg: finalWeight,
      deltaKg: math.round(finalWeight - weightKg, 1),
      projectedBmi: bmi,
      tdee: Math.round(tdee),
      dailyBalance: Math.round(dailyBalance),
    },
  };
}

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function scoreToGrade(score) {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * 目標カロリー計算（体重 × 活動量別の簡易版）
 */
export function calcTargetCalories(weightKg, heightCm, age, gender, activityLevel = 'moderate') {
  const bmr =
    gender === 'female'
      ? math.evaluate('10*w + 6.25*h - 5*a - 161', { w: weightKg, h: heightCm, a: age })
      : math.evaluate('10*w + 6.25*h - 5*a + 5', { w: weightKg, h: heightCm, a: age });

  const coeffs = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = math.multiply(bmr, coeffs[activityLevel] ?? 1.55);

  return {
    maintenance: Math.round(tdee),
    weightLoss: Math.round(math.subtract(tdee, 500)),
    aggressiveLoss: Math.round(math.subtract(tdee, 750)),
  };
}
