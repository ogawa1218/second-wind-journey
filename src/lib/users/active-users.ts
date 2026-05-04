import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * onboarding_completed_at が NULL でなく、crisis_detected_at が NULL の
 * 「能動的に AI を受け取れるユーザー」一覧を返す。
 */
export async function getActiveUsers(): Promise<{ id: string }[]> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .not("onboarding_completed_at", "is", null)
    .is("crisis_detected_at", null);

  if (error) throw error;
  return data ?? [];
}
