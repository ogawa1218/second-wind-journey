"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAuthUser } from "@/lib/supabase/server-component";
import { supabaseAdmin } from "@/lib/supabase/server";

const DailyRecordSchema = z.object({
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.coerce.number().positive().max(500).optional(),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  sleepQuality: z.coerce.number().int().min(1).max(5).optional(),
  mood: z.coerce.number().int().min(1).max(5).optional(),
  bodyFatPercent: z.coerce.number().positive().max(99.99).optional(),
  restingHeartRate: z.coerce.number().int().positive().max(300).optional(),
  note: z.string().max(500).optional(),
});

export type DailyRecordFormState = { ok: boolean; error?: string };

function pickIfPresent<T>(value: T | undefined, raw: FormDataEntryValue | null): T | null {
  // 入力欄が空なら null（明示的に消す）、入っていれば値を保存
  if (raw === null || raw === "") return null;
  return value ?? null;
}

export async function submitDailyRecord(
  _prev: DailyRecordFormState,
  formData: FormData,
): Promise<DailyRecordFormState> {
  const user = await getCurrentAuthUser();
  if (!user) return { ok: false, error: "ログインし直してください" };

  const raw = {
    recordDate: formData.get("recordDate"),
    weightKg: formData.get("weightKg") || undefined,
    sleepHours: formData.get("sleepHours") || undefined,
    sleepQuality: formData.get("sleepQuality") || undefined,
    mood: formData.get("mood") || undefined,
    bodyFatPercent: formData.get("bodyFatPercent") || undefined,
    restingHeartRate: formData.get("restingHeartRate") || undefined,
    note: formData.get("note") || undefined,
  };

  const parsed = DailyRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" / ") };
  }

  const d = parsed.data;
  const { error } = await supabaseAdmin.from("daily_records").upsert(
    {
      user_id: user.id,
      record_date: d.recordDate,
      weight_kg: pickIfPresent(d.weightKg, formData.get("weightKg")),
      sleep_hours: pickIfPresent(d.sleepHours, formData.get("sleepHours")),
      sleep_quality: pickIfPresent(d.sleepQuality, formData.get("sleepQuality")),
      mood: pickIfPresent(d.mood, formData.get("mood")),
      body_fat_percent: pickIfPresent(d.bodyFatPercent, formData.get("bodyFatPercent")),
      resting_heart_rate: pickIfPresent(d.restingHeartRate, formData.get("restingHeartRate")),
      note: d.note ?? null,
    },
    { onConflict: "user_id,record_date" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  redirect("/");
}
