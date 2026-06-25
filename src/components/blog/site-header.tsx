import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tighter text-white">
            MASH
          </span>
          <span className="hidden text-xs text-[#525252] sm:block">
            サブエガ164日チャレンジ
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-[#a3a3a3] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            ホーム
          </Link>
          <Link
            href="/blog"
            className="rounded-md px-3 py-1.5 text-[#a3a3a3] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            ランログ
          </Link>
          <Link
            href="/#about"
            className="rounded-md px-3 py-1.5 text-[#a3a3a3] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            プロフィール
          </Link>
          <Link
            href="/dashboard"
            className="ml-2 rounded-md bg-[#f97316] px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-[#ea6b00]"
          >
            管理
          </Link>
        </nav>
      </div>
    </header>
  );
}
