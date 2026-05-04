import { describe, it, expect } from "vitest";
import {
  calculateVitalityScore,
  VitalityScoreInputError,
  type BehaviorData,
} from "@/lib/vitality-score";

const baseline: BehaviorData = {
  age: 40,
  gender: "male",
  heightCm: 170,
  weightKg: 65,
  restingHeartRate: 65,
  avgSleepHours: 7,
  weeklyMetMinutes: 600,
};

describe("Spec §8 reference cases", () => {
  it("T-7.1 マーシー現状 → 29.5", () => {
    const r = calculateVitalityScore({
      age: 38,
      gender: "male",
      heightCm: 172,
      weightKg: 68.5,
      restingHeartRate: 52,
      avgSleepHours: 6.5,
      weeklyMetMinutes: 1800,
      bodyFatPercent: 13,
    });
    expect(r.vitalityScore).toBe(29.5);
    expect(r.diff).toBe(-8.5);
    expect(r.layer1Score).toBe(-8.5);
    expect(r.layer2Score).toBeNull();
    expect(r.breakdown.bmi).toBe(-1);
    expect(r.breakdown.restingHeartRate).toBe(-2);
    expect(r.breakdown.sleep).toBe(0.5);
    expect(r.breakdown.activity).toBe(-4);
    expect(r.breakdown.bodyFat).toBe(-2);
    expect(r.reliability).toBe("medium");
    expect(r.clipped).toBe(false);
  });

  it("T-7.2 100kg時代 → 47.0", () => {
    const r = calculateVitalityScore({
      age: 30,
      gender: "male",
      heightCm: 172,
      weightKg: 100,
      restingHeartRate: 75,
      avgSleepHours: 5.5,
      weeklyMetMinutes: 100,
      bodyFatPercent: 32,
    });
    expect(r.vitalityScore).toBe(47);
    expect(r.diff).toBe(17);
    expect(r.breakdown.bmi).toBe(6);
    expect(r.breakdown.restingHeartRate).toBe(1.5);
    expect(r.breakdown.sleep).toBe(2.5);
    expect(r.breakdown.activity).toBe(3);
    expect(r.breakdown.bodyFat).toBe(4);
  });

  it("T-7.3 健診込み理想型 → 30.9, reliability='high'", () => {
    const r = calculateVitalityScore(
      {
        age: 38,
        gender: "male",
        heightCm: 172,
        weightKg: 68.5,
        restingHeartRate: 52,
        avgSleepHours: 6.5,
        weeklyMetMinutes: 1800,
        bodyFatPercent: 13,
      },
      { hba1c: 5.2, ldl: 95, hdl: 68, triglyceride: 80, systolicBp: 115 },
    );
    expect(r.vitalityScore).toBe(30.9);
    expect(r.diff).toBe(-7.1);
    expect(r.layer1Score).toBe(-8.5);
    expect(r.layer2Score).toBe(-5);
    expect(r.reliability).toBe("high");
  });
});

describe("Spec §8.4 boundary tests", () => {
  it("T-04 BMI 23.0 ちょうど → bmi = -1.0", () => {
    const r = calculateVitalityScore({ ...baseline, weightKg: 66.5, heightCm: 170 });
    // bmi = 66.5 / 1.7^2 = 23.0103... なので -1.0 バケツ
    expect(r.breakdown.bmi).toBe(-1);
  });

  it("T-05 BMI 24.99 → bmi = -1.0", () => {
    const r = calculateVitalityScore({ ...baseline, weightKg: 72.21, heightCm: 170 });
    expect(r.breakdown.bmi).toBe(-1);
  });

  it("T-06 BMI 25.0 ちょうど → bmi = +2.0", () => {
    // 25.0 ちょうどは `< 25.0` で false → +2.0 バケツ
    const r = calculateVitalityScore({ ...baseline, weightKg: 72.25, heightCm: 170 });
    expect(r.breakdown.bmi).toBe(2);
  });

  it("T-07 RHR 50 ちょうど → rhr = -2.0", () => {
    const r = calculateVitalityScore({ ...baseline, restingHeartRate: 50 });
    expect(r.breakdown.restingHeartRate).toBe(-2);
  });

  it("T-08 RHR 49.9 → rhr = -3.0", () => {
    const r = calculateVitalityScore({ ...baseline, restingHeartRate: 49.9 });
    expect(r.breakdown.restingHeartRate).toBe(-3);
  });

  it("T-09 睡眠 7.0 ちょうど → sleep = -2.0", () => {
    const r = calculateVitalityScore({ ...baseline, avgSleepHours: 7.0 });
    expect(r.breakdown.sleep).toBe(-2);
  });

  it("T-10 活動 3000 ちょうど → activity = -3.5", () => {
    const r = calculateVitalityScore({ ...baseline, weeklyMetMinutes: 3000 });
    expect(r.breakdown.activity).toBe(-3.5);
  });
});

describe("Spec §8.4 input validation", () => {
  it("T-11 weightKg=0 → throws", () => {
    expect(() =>
      calculateVitalityScore({ ...baseline, weightKg: 0 }),
    ).toThrow(VitalityScoreInputError);
  });

  it("T-12 heightCm=0 → throws", () => {
    expect(() =>
      calculateVitalityScore({ ...baseline, heightCm: 0 }),
    ).toThrow(VitalityScoreInputError);
  });

  it("T-13 RHR=0 → throws", () => {
    expect(() =>
      calculateVitalityScore({ ...baseline, restingHeartRate: 0 }),
    ).toThrow(VitalityScoreInputError);
  });

  it("T-15 ldl=0 → throws (out of valid range 20-500)", () => {
    expect(() =>
      calculateVitalityScore(baseline, { hba1c: 5.2, ldl: 0 }),
    ).toThrow(VitalityScoreInputError);
  });
});

describe("Spec §8.4 misc edge cases", () => {
  it("T-14 checkup の null フィールド混在 → reliability='low'", () => {
    const r = calculateVitalityScore(baseline, {
      hba1c: 5.2,
      ldl: undefined,
      hdl: undefined,
      triglyceride: undefined,
      systolicBp: undefined,
    });
    expect(r.reliability).toBe("low");
    expect(r.layer2Score).toBe(-2);
  });

  it("T-16 gender='other' + bodyFat=17 → female 計算で -2.0", () => {
    const r = calculateVitalityScore({
      ...baseline,
      gender: "other",
      bodyFatPercent: 17,
    });
    expect(r.breakdown.bodyFat).toBe(-2);
  });

  it("T-17 100歳・最悪値 → clipped=true, vitalityScore=100, diff=0", () => {
    const r = calculateVitalityScore({
      age: 100,
      gender: "male",
      heightCm: 170,
      weightKg: 105, // BMI 36.3 → +9.0
      restingHeartRate: 95, // +5.0
      avgSleepHours: 4, // +4.0
      weeklyMetMinutes: 50, // +3.0
      bodyFatPercent: 35, // +4.0
    });
    expect(r.vitalityScore).toBe(100);
    expect(r.diff).toBe(0);
    expect(r.clipped).toBe(true);
  });

  it("健診で全 null → checkup なしと同等の reliability 判定", () => {
    const r = calculateVitalityScore(baseline, {
      hba1c: undefined,
      ldl: undefined,
      hdl: undefined,
      triglyceride: undefined,
      systolicBp: undefined,
    });
    expect(r.layer2Score).toBeNull();
    // baseline は bodyFatPercent なし → 'low'
    expect(r.reliability).toBe("low");
  });

  it("女性 + 性別係数 0.85 が適用される", () => {
    const r = calculateVitalityScore({
      ...baseline,
      gender: "female",
      // bmi 22.49 → -2.0、rhr 65 → 0、sleep 7.0 → -2.0、act 600 → -2.0（600は「< 600」がfalseで-2.0バケツ）
      // layer1Score = -6.0
      // adjusted = -6.0 * 0.85 = -5.1
      // age 40 - 5.1 = 34.9
    });
    expect(r.layer1Score).toBe(-6);
    expect(r.vitalityScore).toBe(34.9);
  });
});
