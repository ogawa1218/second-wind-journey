import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createSupabaseServerClient,
  getCurrentAuthUser,
} from "@/lib/supabase/server-component";
import DailyRecordForm from "./form";

export default async function DailyPage() {
  const user = await getCurrentAuthUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);

  // 今日の既存レコード（あれば fill する）
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("daily_records")
    .select(
      "weight_kg, sleep_hours, sleep_quality, mood, body_fat_percent, resting_heart_rate, note",
    )
    .eq("user_id", user.id)
    .eq("record_date", today)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="text-xs text-zinc-500">{today}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">今日を記録</h1>
        </div>
        <Link
          href="/"
          className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
        >
          ← ホーム
        </Link>
      </header>

      <DailyRecordForm
        recordDate={today}
        defaults={{
          weightKg: existing?.weight_kg ?? null,
          sleepHours: existing?.sleep_hours ?? null,
          sleepQuality: existing?.sleep_quality ?? null,
          mood: existing?.mood ?? null,
          bodyFatPercent: existing?.body_fat_percent ?? null,
          restingHeartRate: existing?.resting_heart_rate ?? null,
          note: existing?.note ?? null,
        }}
      />
    </main>
  );
}
