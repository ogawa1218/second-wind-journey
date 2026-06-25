interface WeightProgressProps {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
}

export default function WeightProgress({
  startWeight,
  currentWeight,
  targetWeight,
}: WeightProgressProps) {
  const totalRange = startWeight - targetWeight;
  const lostSoFar = startWeight - currentWeight;
  const progressPct = Math.min(100, Math.max(0, (lostSoFar / totalRange) * 100));
  const currentPct = Math.min(100, Math.max(0, ((startWeight - currentWeight) / totalRange) * 100));

  return (
    <div className="mt-6 rounded-xl border border-[#1a1a1a] bg-[#111111] p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-[#a3a3a3]">体重の旅路</h3>
        <span className="text-xs text-[#525252]">
          スタートから <span className="font-bold text-[#22c55e]">-{lostSoFar}kg</span> ／ あと{" "}
          <span className="font-bold text-[#f97316]">{currentWeight - targetWeight}kg</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 relative">
        <div className="h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Current weight marker */}
        <div
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${currentPct}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-5 w-0.5 bg-[#f97316]" />
          <div className="mt-1 rounded bg-[#f97316] px-1.5 py-0.5 text-[10px] font-bold text-black whitespace-nowrap">
            今 {currentWeight}kg
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-8 flex justify-between text-xs text-[#525252]">
        <div>
          <span className="font-bold text-[#737373]">{startWeight}kg</span>
          <p>スタート</p>
        </div>
        <div className="text-center">
          <span className="font-bold text-[#f97316]">{targetWeight}kg</span>
          <p>レース目標</p>
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: "8/1", target: 69 },
          { label: "9/1", target: 67 },
          { label: "10/1", target: 65.5 },
          { label: "11/22", target: 64 },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-md px-2 py-1 text-xs ${
              currentWeight <= m.target
                ? "bg-[#22c55e]/10 text-[#22c55e]"
                : "bg-[#1a1a1a] text-[#525252]"
            }`}
          >
            {m.label} → {m.target}kg{" "}
            {currentWeight <= m.target && "✓"}
          </div>
        ))}
      </div>
    </div>
  );
}
