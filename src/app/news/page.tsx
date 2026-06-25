import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/blog/site-header";
import CategoryNav from "@/components/news/category-nav";
import NewsCard from "@/components/news/news-card";
import { CATEGORIES, fetchAllNews } from "@/lib/news/rss-fetch";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "健康ニュース | MASH サブエガ164日チャレンジ",
  description:
    "マラソントレーニング・睡眠・栄養・ウェアラブルテックなど、元100kg→現在72kgの市民ランナーMASHが実データで検証する健康ニュースまとめ。つくばマラソン2026サブエガ挑戦の全記録。",
  alternates: {
    canonical: "https://mash-health.vercel.app/news",
  },
};

const SITE_URL = "https://mash-health.vercel.app";

export default async function NewsPage() {
  const newsMap = await fetchAllNews();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MASH サブエガ164日チャレンジ",
    url: SITE_URL,
    description:
      "元100kg→現在72kgの市民ランナーMASHがサブエガ達成を目指す164日間の挑戦記録",
    publisher: {
      "@type": "Person",
      name: "MASH",
      url: SITE_URL,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "健康ニュース",
        item: `${SITE_URL}/news`,
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <SiteHeader />

      <CategoryNav categories={CATEGORIES} />

      <main className="mx-auto max-w-3xl px-4 pb-24">
        {/* ページヘッド */}
        <div className="py-10">
          <h1 className="text-2xl font-black tracking-tight text-white">
            健康ニュース
          </h1>
          <p className="mt-1 text-sm text-[#525252]">
            マラソン・睡眠・栄養・テックなど、サブエガ挑戦に関わる最新情報をカテゴリ別に集約
          </p>
        </div>

        {/* カテゴリ別セクション */}
        <div className="space-y-14">
          {CATEGORIES.map((cat) => {
            const articles = (newsMap[cat.slug] ?? []).slice(0, 3);
            return (
              <section key={cat.slug}>
                {/* セクション見出し */}
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">
                    <span className="mr-2">{cat.emoji}</span>
                    {cat.nameJp}
                  </h2>
                  <Link
                    href={`/news/${cat.slug}`}
                    className="text-xs text-[#a3a3a3] transition hover:text-white"
                  >
                    もっと見る →
                  </Link>
                </div>

                {articles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {articles.map((item, idx) => (
                      <NewsCard key={`${item.link}-${idx}`} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-8 text-center text-sm text-[#525252]">
                    現在ニュースを取得中です
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
