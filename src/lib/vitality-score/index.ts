import type {
  BehaviorData,
  CheckupData,
  Gender,
  VitalityScoreBreakdown,
  VitalityScoreResult,
} from "./types";
import { validateBehaviorInput, validateCheckupInput } from "./validation";

export type {
  BehaviorData,
  CheckupData,
  Gender,
  VitalityScoreBreakdown,
  VitalityScoreResult,
} from "./types";
export { VitalityScoreInputError } from "./validation";

function calculateBmiAdjustment(bmi: number): number {
  if (bmi < 18.5) return 2.0;
  if (bmi < 23.0) return -2.0;
  if (bmi < 25.0) return -1.0;
  if (bmi < 27.5) return 2.0;
  if (bmi < 30.0) return 4.0;
  if (bmi < 35.0) return 6.0;
  return 9.0;
}

function calculateRhrAdjustment(rhr: number): number {
  if (rhr < 50) return -3.0;
  if (rhr < 60) return -2.0;
  if (rhr < 70) return 0.0;
  if (rhr < 80) return 1.5;
  if (rhr < 90) return 3.0;
  return 5.0;
}

function calculateSleepAdjustment(hours: number): number {
  if (hours < 5.0) return 4.0;
  if (hours < 6.0) return 2.5;
  if (hours < 7.0) return 0.5;
  if (hours < 8.5) return -2.0;
  if (hours < 9.5) return 0.0;
  return 1.5;
}

function calculateActivityAdjustment(metMinutes: number): number {
  if (metMinutes < 150) return 3.0;
  if (metMinutes < 600) return 0.0;
  if (metMinutes < 1200) return -2.0;
  if (metMinutes < 3000) return -4.0;
  return -3.5;
}

function calculateBodyFatAdjustment(bodyFatPercent: number, gender: Gender): number {
  if (gender === "male") {
    if (bodyFatPercent < 10) return -1.0;
    if (bodyFatPercent < 18) return -2.0;
    if (bodyFatPercent < 25) return 0.0;
    if (bodyFatPercent < 30) return 2.0;
    return 4.0;
  }
  if (bodyFatPercent < 16) return -1.0;
  if (bodyFatPercent < 24) return -2.0;
  if (bodyFatPercent < 31) return 0.0;
  if (bodyFatPercent < 36) return 2.0;
  return 4.0;
}

function calculateHba1cAdjustment(v: number): number {
  if (v < 5.5) return -2.0;
  if (v < 6.0) return 0.0;
  if (v < 6.5) return 3.0;
  if (v < 7.0) return 5.0;
  return 8.0;
}

function calculateLdlAdjustment(v: number): number {
  if (v < 100) return -1.0;
  if (v < 120) return 0.0;
  if (v < 140) return 1.5;
  if (v < 180) return 3.0;
  return 5.0;
}

function calculateHdlAdjustment(v: number): number {
  if (v >= 60) return -1.5;
  if (v >= 40) return 0.0;
  return 3.0;
}

function calculateTgAdjustment(v: number): number {
  if (v < 100) return -0.5;
  if (v < 150) return 0.0;
  if (v < 200) return 1.5;
  if (v < 500) return 3.0;
  return 5.0;
}

function calculateBpAdjustment(v: number): number {
  if (v < 110) return -1.5;
  if (v < 120) return 0.0;
  if (v < 130) return 1.0;
  if (v < 140) return 2.5;
  if (v < 160) return 4.0;
  return 6.0;
}

interface Layer1Output {
  score: number;
  breakdown: Pick<
    VitalityScoreBreakdown,
    "bmi" | "restingHeartRate" | "sleep" | "activity" | "bodyFat"
  >;
}

export function calculateLayer1(data: BehaviorData): Layer1Output {
  const heightM = data.heightCm / 100;
  const bmi = data.weightKg / (heightM * heightM);

  const breakdown = {
    bmi: calculateBmiAdjustment(bmi),
    restingHeartRate: calculateRhrAdjustment(data.restingHeartRate),
    sleep: calculateSleepAdjustment(data.avgSleepHours),
    activity: calculateActivityAdjustment(data.weeklyMetMinutes),
    bodyFat:
      data.bodyFatPercent != null
        ? calculateBodyFatAdjustment(data.bodyFatPercent, data.gender)
        : 0,
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}

interface Layer2Output {
  score: number;
  breakdown: Pick<
    VitalityScoreBreakdown,
    "hba1c" | "ldl" | "hdl" | "triglyceride" | "systolicBp"
  >;
  itemCount: number;
}

export function calculateLayer2(checkup: CheckupData): Layer2Output {
  const breakdown = {
    hba1c: checkup.hba1c != null ? calculateHba1cAdjustment(checkup.hba1c) : 0,
    ldl: checkup.ldl != null ? calculateLdlAdjustment(checkup.ldl) : 0,
    hdl: checkup.hdl != null ? calculateHdlAdjustment(checkup.hdl) : 0,
    triglyceride:
      checkup.triglyceride != null ? calculateTgAdjustment(checkup.triglyceride) : 0,
    systolicBp:
      checkup.systolicBp != null ? calculateBpAdjustment(checkup.systolicBp) : 0,
  };

  const itemCount = Object.values(checkup).filter((v) => v != null).length;
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown, itemCount };
}

const ZERO_LAYER2_BREAKDOWN: Layer2Output["breakdown"] = {
  hba1c: 0,
  ldl: 0,
  hdl: 0,
  triglyceride: 0,
  systolicBp: 0,
};

export function calculateVitalityScore(
  behavior: BehaviorData,
  checkup?: CheckupData,
): VitalityScoreResult {
  validateBehaviorInput(behavior);
  if (checkup) validateCheckupInput(checkup);

  const layer1 = calculateLayer1(behavior);

  let layer2Score: number | null = null;
  let layer2Breakdown = ZERO_LAYER2_BREAKDOWN;
  let reliability: VitalityScoreResult["reliability"] = "medium";

  const hasCheckup = checkup && Object.values(checkup).some((v) => v != null);
  if (hasCheckup) {
    const l2 = calculateLayer2(checkup);
    layer2Score = l2.score;
    layer2Breakdown = l2.breakdown;
    if (l2.itemCount >= 4) reliability = "high";
    else if (l2.itemCount >= 2) reliability = "medium";
    else reliability = "low";
  } else {
    reliability = behavior.bodyFatPercent != null ? "medium" : "low";
  }

  const blendedScore =
    layer2Score !== null ? layer1.score * 0.6 + layer2Score * 0.4 : layer1.score;

  const genderCoef = behavior.gender === "female" ? 0.85 : 1.0;
  const adjustedScore = blendedScore * genderCoef;

  const rawAge = behavior.age + adjustedScore;
  const clipped = rawAge < 20 || rawAge > 100;
  const vitalityScore = Math.max(20, Math.min(100, Math.round(rawAge * 10) / 10));

  return {
    vitalityScore,
    chronologicalAge: behavior.age,
    diff: Number((vitalityScore - behavior.age).toFixed(2)),
    clipped,
    layer1Score: layer1.score,
    layer2Score,
    breakdown: { ...layer1.breakdown, ...layer2Breakdown },
    reliability,
  };
}
