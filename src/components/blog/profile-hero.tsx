interface ProfileHeroProps {
  dayNumber: number;
}

export default function ProfileHero({ dayNumber }: ProfileHeroProps) {
  return (
    <section className="py-12">
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#f97316] to-[#c2410c] text-4xl font-black text-white shadow-lg shadow-orange-900/30">
            M
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#22c55e] text-xs font-bold text-black">
            🏃
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-black tracking-tighter text-white">
              MASH
            </h1>
            <span className="text-sm text-[#525252]">小川雅史 / 181cm</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-[#f97316]">
            つくばマラソン2026 サブエガ（2:50切り）を目指す164日
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-[#a3a3a3]">
              元100kg → 現在72kg
            </span>
            <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-[#a3a3a3]">
              毎朝3:45-5:00起床
            </span>
            <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-[#a3a3a3]">
              行動序列ドミノ実践中
            </span>
            <span className="rounded-full bg-[#f97316]/10 px-3 py-1 font-semibold text-[#f97316]">
              Day {dayNumber}/164
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
