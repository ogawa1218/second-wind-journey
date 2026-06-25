import SiteHeader from "@/components/blog/site-header";
import ProfileHero from "@/components/blog/profile-hero";
import ChallengeStats from "@/components/blog/challenge-stats";
import WeightProgress from "@/components/blog/weight-progress";
import RunLogCard from "@/components/blog/run-log-card";
import Link from "next/link";
import {
  RUNS,
  getDayNumber,
  getDaysToRace,
  START_WEIGHT,
  TARGET_WEIGHT,
} from "@/lib/blog/run-data";

const CURRENT_WEIGHT = 72;

export const metadata = {
  title: "MASH | サブエガ164日チャレンジ",
  description:
    "元100kg→現在72kg。2026年11月22日つくばマラソンでサブエガ（2時間50分切り）を目指す164日間の記録。",
};

export default function BlogHomePage() {
  const today = new Date();
  const dayNumber = getDayNumber(today);
  const daysToRace = getDaysToRace(today);
  const totalKm = RUNS.reduce((sum, r) => sum + r.distanceKm, 0);
  const latestRuns = RUNS.slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 pb-24">
        {/* ヒーロー */}
        <ProfileHero dayNumber={dayNumber} />

        {/* チャレンジ統計 */}
        <ChallengeStats
          dayNumber={dayNumber}
          daysToRace={daysToRace}
          currentWeight={CURRENT_WEIGHT}
          targetWeight={TARGET_WEIGHT}
          startWeight={START_WEIGHT}
          totalKm={totalKm}
        />

        {/* 体重の旅路 */}
        <WeightProgress
          startWeight={START_WEIGHT}
          currentWeight={CURRENT_WEIGHT}
          targetWeight={TARGET_WEIGHT}
        />

        {/* 最近のラン */}
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">最近のラン</h2>
            <Link
              href="/blog"
              className="text-sm text-[#f97316] transition hover:text-[#ea6b00]"
            >
              すべて見る →
            </Link>
          </div>

          {latestRuns.length > 0 ? (
            <div className="space-y-3">
              {latestRuns.map((run) => (
                <RunLogCard key={run.date} run={run} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-8 text-center text-[#525252]">
              <p className="text-2xl">🏃</p>
              <p className="mt-2 text-sm">まだランニング記録がありません</p>
            </div>
          )}
        </section>

        {/* プロフィール / About */}
        <section id="about" className="mt-16 border-t border-[#1a1a1a] pt-12">
          <h2 className="text-xl font-bold text-white">プロフィール</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {/* Story */}
            <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-5">
              <h3 className="text-sm font-semibold text-[#f97316]">ストーリー</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#a3a3a3]">
                2015年、体重100kgを記録。慢性的な睡眠負債、乱れた食生活、運動ゼロ。
                「このままでは死ぬ」と思った。
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#a3a3a3]">
                「行動序列ドミノ（睡眠→食事→運動）」を軸にライフスタイルを再設計し、
                現在72kg（−28kg）まで絞ることができた。
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                次のステージは2時間50分切り。
              </p>
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-5">
              <h3 className="text-sm font-semibold text-[#f97316]">スペック</h3>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  ["身長", "181cm"],
                  ["スタート体重", "100kg"],
                  ["現在体重", "72kg"],
                  ["レース目標体重", "64kg"],
                  ["目標タイム", "2:50:00（サブエガ）"],
                  ["レース", "2026-11-22 つくばマラソン"],
                  ["練習スタイル", "毎朝3:45〜5:00起床"],
                  ["シューズ（練習）", "アシックス ノヴァブラスト5"],
                  ["シューズ（レース）", "アシックス メタスピードスカイ東京"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-[#525252]">{k}</span>
                    <span className="text-right text-[#d4d4d4]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="mt-6 rounded-xl border border-[#f97316]/20 bg-[#f97316]/5 p-5">
            <h3 className="text-sm font-semibold text-[#f97316]">行動序列ドミノ</h3>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <Step label="睡眠" num={1} />
              <Arrow />
              <Step label="食事" num={2} />
              <Arrow />
              <Step label="運動" num={3} />
            </div>
            <p className="mt-4 text-sm text-[#a3a3a3]">
              睡眠が崩れたら食事を優先し、食事が整ったら運動が自然に動き出す。
              この順番を守ることが、164日間の継続を支える。
            </p>
            <p className="mt-3 text-base font-bold text-[#f97316]">
              「退路を断てば、前に進むしかない。」
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-[#1a1a1a] pt-8 text-center text-xs text-[#525252]">
          <p>MASH — サブエガ164日チャレンジ 2026</p>
        </footer>
      </main>
    </div>
  );
}

function Step({ label, num }: { label: string; num: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f97316] text-xs font-bold text-black">
        {num}
      </span>
      <span className="font-semibold text-white">{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-[#525252]">→</span>;
}
