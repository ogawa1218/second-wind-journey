/**
 * JSON-LD structured data components (Server Components)
 * All components render <script type="application/ld+json"> tags.
 */

const SITE_URL = 'https://mash-health.vercel.app'
const SITE_NAME = 'MASH サブエガ164日チャレンジ'

// ---------------------------------------------------------------------------
// WebSiteJsonLd
// ---------------------------------------------------------------------------

export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      '元100kg→現在72kgの市民ランナーMASHが実データで検証。つくばマラソン2026サブエガ挑戦の全記録。',
    inLanguage: 'ja',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ---------------------------------------------------------------------------
// PersonJsonLd
// ---------------------------------------------------------------------------

export function PersonJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'MASH（小川雅史）',
    description: '元100kgのマラソンランナー',
    url: SITE_URL,
    sameAs: [SITE_URL],
    knowsAbout: [
      'マラソントレーニング',
      'サブエガ',
      'ランニング栄養',
      '体重管理',
      'Garminデータ活用',
      '睡眠最適化',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ---------------------------------------------------------------------------
// BreadcrumbJsonLd — カテゴリページ用
// ---------------------------------------------------------------------------

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ---------------------------------------------------------------------------
// NewsArticleJsonLd — 記事カード用
// ---------------------------------------------------------------------------

interface NewsArticleJsonLdProps {
  headline: string
  url: string
  datePublished: string
  description?: string
  authorName?: string
  publisherName?: string
}

export function NewsArticleJsonLd({
  headline,
  url,
  datePublished,
  description,
  authorName = 'MASH（小川雅史）',
  publisherName = SITE_NAME,
}: NewsArticleJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    url,
    datePublished,
    ...(description ? { description } : {}),
    author: {
      '@type': 'Person',
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
