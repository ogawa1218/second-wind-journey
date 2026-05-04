"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/supabase/server-component";
import { supabaseAdmin } from "@/lib/supabase/server";

const OnboardingSchema = z.object({
  displayName: z.string().min(1).max(50),
  gender: z.enum(["male", "female", "other"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  heightCm: z.coerce.number().min(50).max(250),
  targetFullMarathonSeconds: z.coerce.number().int().positive().optional(),
  coachTone: z.enum(["coach", "spartan", "supporter"]),
});

export type OnboardingFormState = {
  ok: boolean;
  error?: string;
};

export async function submitOnboarding(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const user = await getCurrentAuthUser();
  if (!user) {
    return { ok: false, error: "認証が切れました。ログインし直してください。" };
  }

  const raw = {
    displayName: formData.get("displayName"),
    gender: formData.get("gender"),
    birthDate: formData.get("birthDate"),
    heightCm: formData.get("heightCm"),
    targetFullMarathonSeconds: formData.get("targetFullMarathonSeconds") || undefined,
    coachTone: formData.get("coachTone"),
  };

  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" / ") };
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      display_name: parsed.data.displayName,
      gender: parsed.data.gender,
      birth_date: parsed.data.birthDate,
      height_cm: parsed.data.heightCm,
      target_full_marathon_seconds: parsed.data.targetFullMarathonSeconds ?? null,
      coach_tone: parsed.data.coachTone,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect("/");
}
