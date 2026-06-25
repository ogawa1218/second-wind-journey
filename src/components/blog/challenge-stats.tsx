interface ChallengeStatsProps {
  dayNumber: number;
  daysToRace: number;
  currentWeight: number;
  targetWeight: number;
  startWeight: number;
  totalKm: number;
}

export default function ChallengeStats({
  dayNumber,
  daysToRace,
  currentWeight,
  targetWeight,
  startWeight,
  totalKm,
}: ChallengeStatsProps) {
  const weightLost = startWeight - currentWeight;
  const weightToGo = currentWeight - targetWeight;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="チャレンジ経過"
        value={`Day ${dayNumber}`}
        sub="/164"
        accent
      />
      <StatCard
        label="レースまで"
        value={`${daysToRace}`}
        sub="日"
      />
      <StatCard
        label="体重"
        value={`${currentWeight}kg`}
        sub={`目標 ${targetWeight}kg（あと${weightToGo}kg）`}
      />
      <StatCard
        label="累計走行距離"
        value={`${totalKm.toFixed(0)}`}
        sub="km"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-[#f97316]/30 bg-[#f97316]/5"
          : "border-[#1a1a1a] bg-[#111111]"
      }`}
    >
      <p className="text-xs text-[#525252]">{label}</p>
      <p
        className={`mt-1 text-2xl font-black tabular-nums tracking-tight ${
          accent ? "text-[#f97316]" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[#737373]">{sub}</p>
    </div>
  );
}
