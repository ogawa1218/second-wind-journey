import type { RunEntry, RunType } from "@/lib/blog/run-data";

const TYPE_COLORS: Record<RunType, string> = {
  イージー: "text-[#22c55e] bg-[#22c55e]/10",
  テンポ走: "text-[#f59e0b] bg-[#f59e0b]/10",
  閾値走: "text-[#f59e0b] bg-[#f59e0b]/10",
  ロング走: "text-[#60a5fa] bg-[#60a5fa]/10",
  インターバル: "text-[#f97316] bg-[#f97316]/10",
  MP走: "text-[#a78bfa] bg-[#a78bfa]/10",
};

interface RunLogCardProps {
  run: RunEntry;
  compact?: boolean;
}

export default function RunLogCard({ run, compact = false }: RunLogCardProps) {
  const typeColor = TYPE_COLORS[run.type] ?? "text-[#a3a3a3] bg-[#1a1a1a]";
  const dateObj = new Date(run.date + "T00:00:00+09:00");
  const dateLabel = dateObj.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <article className="group rounded-xl border border-[#1a1a1a] bg-[#111111] p-4 transition hover:border-[#2a2a2a] hover:bg-[#161616]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#f97316]">
            Day {run.day}
          </span>
          <span className="text-xs text-[#525252]">{dateLabel}</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor}`}>
          {run.type}
        </span>
      </div>

      {/* Main stat */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-black tabular-nums tracking-tighter text-white">
          {run.distanceKm.toFixed(1)}
        </span>
        <span className="text-sm text-[#525252]">km</span>
      </div>

      {/* Stats row */}
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <StatItem label="ペース" value={`${run.avgPaceStr}/km`} />
        <StatItem label="心拍" value={`${run.avgHR}bpm`} />
        <StatItem label="時間" value={run.durationStr} />
        {!compact && run.calories > 0 && (
          <StatItem label="カロリー" value={`${run.calories}kcal`} />
        )}
      </div>

      {/* Bio metrics */}
      {!compact && (run.weight || run.sleepH) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {run.weight && (
            <span className="rounded-md bg-[#1a1a1a] px-2 py-0.5 text-xs text-[#737373]">
              体重 {run.weight}kg
            </span>
          )}
          {run.sleepH && run.sleepScore && (
            <span className="rounded-md bg-[#1a1a1a] px-2 py-0.5 text-xs text-[#737373]">
              睡眠 {run.sleepH}h・スコア {run.sleepScore}pt
            </span>
          )}
        </div>
      )}

      {/* Memo */}
      {run.memo && (
        <p className="mt-3 border-t border-[#1a1a1a] pt-3 text-sm text-[#737373]">
          {run.memo}
        </p>
      )}
    </article>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-[#525252]">{label} </span>
      <span className="font-semibold text-[#d4d4d4] tabular-nums">{value}</span>
    </div>
  );
}
