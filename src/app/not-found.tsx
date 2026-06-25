import Link from "next/link";
import SiteHeader from "@/components/blog/site-header";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center">
        <p className="text-6xl font-black tracking-tighter text-[#f97316]">404</p>
        <h1 className="mt-6 text-xl font-bold text-white">
          ページが見つかりません
        </h1>
        <p className="mt-3 text-sm text-[#a3a3a3]">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-md bg-[#f97316] px-4 py-2 font-semibold text-black transition hover:bg-[#ea6b00]"
          >
            ホームへ戻る
          </Link>
          <Link
            href="/news"
            className="rounded-md border border-[#1a1a1a] px-4 py-2 text-[#a3a3a3] transition hover:border-[#2a2a2a] hover:text-white"
          >
            健康ニュースを見る
          </Link>
        </div>
      </main>
    </div>
  );
}
