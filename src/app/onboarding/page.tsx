import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getCurrentAuthUser,
} from "@/lib/supabase/server-component";
import OnboardingForm from "./form";

export default async function OnboardingPage() {
  const user = await getCurrentAuthUser();
  if (!user) redirect("/login");

  // すでに完了済みならホームへ
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) redirect("/");

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">プロフィール設定</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Vitality Score の算出と、AIコーチの口調設定に使います。
        </p>
      </header>
      <OnboardingForm />
      <p className="mt-8 text-xs text-zinc-400">
        ※ 入力情報はあなたの体の指標を見える化する目的にのみ使用されます。医療診断ではありません。
      </p>
    </main>
  );
}
