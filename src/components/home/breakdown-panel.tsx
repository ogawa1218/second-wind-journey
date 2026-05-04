import type { Json } from "@/lib/supabase/database.types";

interface Props {
  breakdown: Json | null;
}

const ITEM_LABELS: Record<string, string> = {
  bmi: "BMI",
  restingHeartRate: "安静時心拍",
  sleep: "睡眠",
  activity: "週間運動量",
  bodyFat: "体脂肪率",
  hba1c: "HbA1c",
  ldl: "LDL",
  hdl: "HDL",
  triglyceride: "中性脂肪",
  systolicBp: "血圧（収縮期）",
};

export default function BreakdownPanel({ breakdown }: Props) {
  if (!breakdown || typeof breakdown !== "object" || Array.isArray(breakdown)) {
    return null;
  }

  const items = Object.entries(breakdown as Record<string, unknown>)
    .filter(([_, v]) => typeof v === "number" && v !== 0)
    .map(([k, v]) => ({ key: k, label: ITEM_LABELS[k] ?? k, value: v as number }))
    .sort((a, b) => a.value - b.value);

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold tracking-wide text-zinc-600 dark:text-zinc-400">
        内訳（改善寄与順）
      </h2>
      <ul className="mt-4 space-y-2">
        {items.map(({ key, label, value }) => {
          const positive = value <= 0;
          return (
            <li
              key={key}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2.5 text-sm dark:bg-zinc-800/50"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{positive ? "🟢" : "🟡"}</span>
                <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
              </span>
              <span
                className={
                  "tabular-nums font-medium " +
                  (positive ? "text-emerald-600" : "text-amber-600")
                }
              >
                {value > 0 ? "+" : ""}
                {value.toFixed(1)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
