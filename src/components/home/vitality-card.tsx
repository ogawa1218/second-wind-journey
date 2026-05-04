interface Props {
  vitalityScore: number | null;
  chronologicalAge: number | null;
  diff: number | null;
  scoreDelta: number | null;
  snapshotDate: string | null;
  reliability: string | null;
}

function getComment(diff: number | null): { emoji: string; label: string } {
  if (diff == null) return { emoji: "—", label: "まだ算出されていません" };
  if (diff <= -10) return { emoji: "🔥", label: "ハイパフォーマンス" };
  if (diff <= -5) return { emoji: "💪", label: "とても若い体" };
  if (diff <= -1) return { emoji: "🟢", label: "良好" };
  if (diff === 0) return { emoji: "➖", label: "標準" };
  if (diff <= 4) return { emoji: "🟡", label: "注意" };
  if (diff <= 9) return { emoji: "🟠", label: "要アクション" };
  return { emoji: "🔴", label: "医師相談を推奨" };
}

function formatDelta(d: number | null): string {
  if (d == null || d === 0) return "—";
  const sign = d < 0 ? "↓" : "↑";
  return `${sign} ${Math.abs(d).toFixed(1)}`;
}

export default function VitalityCard(props: Props) {
  const comment = getComment(props.diff);
  const noData = props.vitalityScore == null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        Vitality Score
      </p>

      <div className="mt-3 flex items-end gap-3">
        <span className="text-6xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white">
          {noData ? "—" : props.vitalityScore!.toFixed(1)}
        </span>
        {props.diff != null && (
          <span
            className={
              "mb-2 text-sm font-medium tabular-nums " +
              (props.diff <= 0 ? "text-emerald-600" : "text-amber-600")
            }
          >
            {props.diff > 0 ? `+${props.diff.toFixed(1)}` : props.diff.toFixed(1)}
          </span>
        )}
      </div>

      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        実年齢{" "}
        <span className="font-medium tabular-nums">
          {props.chronologicalAge?.toFixed(0) ?? "—"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          {comment.emoji}
        </span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {comment.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>前回比 {formatDelta(props.scoreDelta)}</span>
        <span>
          {props.snapshotDate ? `更新 ${props.snapshotDate}` : "未算出"}
          {props.reliability && ` ・ 信頼度 ${labelReliability(props.reliability)}`}
        </span>
      </div>
    </section>
  );
}

function labelReliability(r: string): string {
  if (r === "high") return "高";
  if (r === "medium") return "中";
  return "低";
}
