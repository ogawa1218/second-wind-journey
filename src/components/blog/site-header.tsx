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
            href="/news"
            className="rounded-md px-3 py-1.5 text-[#a3a3a3] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            ニュース
          </Link>
          <Link
            href="/#about"
            className="rounded-md px-3 py-1.5 text-[#a3a3a3] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            プロフィール
          </Link>
          {/* 管理導線は読者向けではないため控えめなテキストリンクに留める */}
          <Link
            href="/dashboard"
            className="ml-1 rounded-md px-2 py-1.5 text-xs text-[#525252] transition hover:bg-[#1a1a1a] hover:text-[#a3a3a3]"
            aria-label="管理ダッシュボード"
          >
            管理
          </Link>
        </nav>
      </div>
    </header>
  );
}
