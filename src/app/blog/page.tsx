import SiteHeader from "@/components/blog/site-header";
import RunLogCard from "@/components/blog/run-log-card";
import { RUNS, getDayNumber, getDaysToRace } from "@/lib/blog/run-data";

export const metadata = {
  title: "ランログ | MASH サブエガ164日チャレンジ",
  description: "164日間のランニング記録。距離・ペース・心拍・体重・睡眠スコアを毎日記録。",
};

const CURRENT_WEIGHT = 72;

export default function BlogPage() {
  const today = new Date();
  const dayNumber = getDayNumber(today);
  const daysToRace = getDaysToRace(today);
  const totalKm = RUNS.reduce((sum, r) => sum + r.distanceKm, 0);
  const avgPaceSec =
    RUNS.length > 0
      ? Math.round(
          RUNS.reduce((sum, r) => {
            const [min, sec] = r.avgPaceStr.replace('"', "").split("'").map(Number);
            return sum + min * 60 + sec;
          }, 0) / RUNS.length
        )
      : 0;
  const avgPaceStr =
    avgPaceSec > 0
      ? `${Math.floor(avgPaceSec / 60)}'${String(avgPaceSec % 60).padStart(2, "0")}"`
      : "—";
  const avgHR =
    RUNS.length > 0
      ? Math.round(RUNS.reduce((sum, r) => sum + r.avgHR, 0) / RUNS.length)
      : 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 pb-24">
        {/* ヘッダー */}
        <div className="py-10">
          <h1 className="text-2xl font-black tracking-tight text-white">
            ランログ
          </h1>
          <p className="mt-1 text-sm text-[#525252]">
            Day {dayNumber}/164 ・ レースまで {daysToRace}日 ・ 現在{CURRENT_WEIGHT}kg
          </p>
        </div>

        {/* 累計統計 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "累計距離", value: `${totalKm.toFixed(0)}km`, sub: `${RUNS.length}回` },
            { label: "平均ペース", value: avgPaceStr, sub: "/km" },
            { label: "平均心拍", value: `${avgHR}bpm`, sub: "有酸素域" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-4">
              <p className="text-xs text-[#525252]">{s.label}</p>
              <p className="mt-1 text-xl font-black tabular-nums text-white">{s.value}</p>
              <p className="text-xs text-[#525252]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* 出張中の空白期間 notice */}
        {RUNS.length > 0 && (() => {
          const latestRunDate = new Date(RUNS[0].date + "T00:00:00+09:00");
          const gapDays = Math.floor((today.getTime() - latestRunDate.getTime()) / 86400000);
          if (gapDays >= 3) {
            return (
              <div className="mt-6 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-4 text-sm text-[#f59e0b]">
                📍 {gapDays}日間のブランク（フィリピン出張）。{RUNS[0].day + gapDays > 0 ? `Day ${RUNS[0].day + gapDays}` : ""}から再開予定。
              </div>
            );
          }
          return null;
        })()}

        {/* ランログ一覧 */}
        <section className="mt-8">
          {RUNS.length > 0 ? (
            <div className="space-y-3">
              {RUNS.map((run) => (
                <RunLogCard key={run.date} run={run} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-12 text-center">
              <p className="text-4xl">🏃</p>
              <p className="mt-4 font-semibold text-white">まだ記録がありません</p>
              <p className="mt-2 text-sm text-[#525252]">
                Garmin連携で自動的に更新されます
              </p>
            </div>
          )}
        </section>

        {/* Garmin連携予告 */}
        <div className="mt-10 rounded-xl border border-[#1a1a1a] bg-[#111111] p-5 text-center text-sm text-[#525252]">
          <p>
            🔗 Garmin Connect と連携済み。毎朝ランニング後に自動更新。
          </p>
          <p className="mt-1 text-xs">
            Threads / Substack にも同時投稿されます
          </p>
        </div>
      </main>
    </div>
  );
}
