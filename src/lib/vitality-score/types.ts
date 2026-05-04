export type Gender = "male" | "female" | "other";

export interface BehaviorData {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  restingHeartRate: number;
  avgSleepHours: number;
  weeklyMetMinutes: number;
  bodyFatPercent?: number;
}

export interface CheckupData {
  hba1c?: number;
  ldl?: number;
  hdl?: number;
  triglyceride?: number;
  systolicBp?: number;
}

export type Reliability = "low" | "medium" | "high";

export interface VitalityScoreBreakdown {
  bmi: number;
  restingHeartRate: number;
  sleep: number;
  activity: number;
  bodyFat: number;
  hba1c: number;
  ldl: number;
  hdl: number;
  triglyceride: number;
  systolicBp: number;
}

export interface VitalityScoreResult {
  /** Final user-facing Vitality Score (year-equivalent value, clipped to 20-100). */
  vitalityScore: number;
  chronologicalAge: number;
  /** Difference after clipping. Use `clipped` to detect the outlier case. */
  diff: number;
  clipped: boolean;
  layer1Score: number;
  layer2Score: number | null;
  breakdown: VitalityScoreBreakdown;
  reliability: Reliability;
}
