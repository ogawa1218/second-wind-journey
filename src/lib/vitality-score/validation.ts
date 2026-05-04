import type { BehaviorData, CheckupData } from "./types";

export class VitalityScoreInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VitalityScoreInputError";
  }
}

function assertRange(field: string, value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new VitalityScoreInputError(
      `${field} must be ${min}-${max}, got ${value}`,
    );
  }
}

export function validateBehaviorInput(d: BehaviorData): void {
  assertRange("age", d.age, 10, 120);
  assertRange("heightCm", d.heightCm, 50, 250);
  assertRange("weightKg", d.weightKg, 20, 300);
  assertRange("restingHeartRate", d.restingHeartRate, 30, 200);
  assertRange("avgSleepHours", d.avgSleepHours, 0, 16);
  assertRange("weeklyMetMinutes", d.weeklyMetMinutes, 0, 30000);
  if (d.bodyFatPercent != null) {
    assertRange("bodyFatPercent", d.bodyFatPercent, 2, 70);
  }
}

export function validateCheckupInput(c: CheckupData): void {
  if (c.hba1c != null) assertRange("hba1c", c.hba1c, 3, 20);
  if (c.ldl != null) assertRange("ldl", c.ldl, 20, 500);
  if (c.hdl != null) assertRange("hdl", c.hdl, 10, 200);
  if (c.triglyceride != null) assertRange("triglyceride", c.triglyceride, 10, 5000);
  if (c.systolicBp != null) assertRange("systolicBp", c.systolicBp, 60, 250);
}
