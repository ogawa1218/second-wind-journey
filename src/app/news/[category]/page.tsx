import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/blog/site-header";
import CategoryNav from "@/components/news/category-nav";
import NewsCard from "@/components/news/news-card";
import { ItemListJsonLd } from "@/components/seo/json-ld";
import { CATEGORIES, fetchCategoryNews } from "@/lib/news/rss-fetch";

export const revalidate = 3600;

const SITE_URL = "https://mash-health.vercel.app";

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.slug }));
}

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return {};

  const title = `${cat.nameJp} ニュース | MASH サブエガ164日チャレンジ`;
  const description = `${cat.description} — 元100kgの市民ランナーMASHが実データで検証。つくばマラソン2026サブエガ挑戦の全記録。`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/news/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);

  if (!cat) {
    notFound();
  }

  const articles = (await fetchCategoryNews(slug)).slice(0, 6);

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
      {
        "@type": "ListItem",
        position: 3,
        name: cat.nameJp,
        item: `${SITE_URL}/news/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ItemListJsonLd
        items={articles.map((a) => ({ name: a.title, url: a.link }))}
        listName={`${cat.nameJp} ニュース`}
      />

      <SiteHeader />

      <CategoryNav categories={CATEGORIES} activeSlug={slug} />

      <main className="mx-auto max-w-3xl px-4 pb-24">
        {/* ページヘッド */}
        <div className="py-10">
          <h1 className="text-2xl font-black tracking-tight text-white">
            <span className="mr-2">{cat.emoji}</span>
            {cat.nameJp}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#525252]">
            {cat.description}
          </p>
        </div>

        {/* キーワードタグ */}
        {cat.keywords.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {cat.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-[#1a1a1a] px-3 py-1 text-xs text-[#737373]"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* 記事グリッド */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {articles.map((item, idx) => (
              <NewsCard key={`${item.link}-${idx}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-16 text-center">
            <p className="text-3xl">{cat.emoji}</p>
            <p className="mt-4 font-semibold text-white">
              現在ニュースを取得中です
            </p>
            <p className="mt-2 text-sm text-[#525252]">
              しばらくしてからページを再読み込みしてください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
