import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getCurrentAuthUser,
} from "@/lib/supabase/server-component";
import { supabaseAdmin } from "@/lib/supabase/server";
import VitalityCard from "@/components/home/vitality-card";
import BreakdownPanel from "@/components/home/breakdown-panel";
import DailyActionPanel from "@/components/home/daily-action-panel";
import HomeNav from "@/components/home/home-nav";

export default async function HomePage() {
  const user = await getCurrentAuthUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("v_user_age")
    .select("display_name, age_decimal, coach_tone, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const [latestRes, dailyActionRes] = await Promise.all([
    supabaseAdmin
      .from("v_latest_vitality_score")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("ai_conversations")
      .select("content, created_at")
      .eq("user_id", user.id)
      .eq("kind", "daily_action")
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const latest = latestRes.data;
  const dailyAction = dailyActionRes.data;

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="text-xs text-zinc-500">Second Wind</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">
            {profile.display_name ?? "あなた"}
          </h1>
        </div>
        <HomeNav />
      </header>

      <div className="space-y-6">
        <VitalityCard
          vitalityScore={latest?.vitality_score ?? null}
          chronologicalAge={latest?.chronological_age ?? profile.age_decimal ?? null}
          diff={latest?.diff ?? null}
          scoreDelta={latest?.score_delta ?? null}
          snapshotDate={latest?.snapshot_date ?? null}
          reliability={latest?.reliability ?? null}
        />

        <DailyActionPanel
          content={dailyAction?.content ?? null}
          createdAt={dailyAction?.created_at ?? null}
        />

        <BreakdownPanel breakdown={latest?.breakdown ?? null} />
      </div>

      <p className="mt-10 text-xs text-zinc-400">
        ※ Vitality Score は行動変容のための参考指標です。健康上の心配がある場合は医師にご相談ください。
      </p>
    </main>
  );
}
