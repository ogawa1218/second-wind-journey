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
      '元100kgの市民ランナーMASHが実データで検証。つくばマラソン2026サブエガ挑戦の全記録。',
    inLanguage: 'ja',
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
// ItemListJsonLd — ニュース一覧用（外部記事へのリンク集なので著者は主張しない）
// ---------------------------------------------------------------------------

interface ItemListJsonLdProps {
  items: { name: string; url: string }[]
  listName?: string
}

export function ItemListJsonLd({ items, listName }: ItemListJsonLdProps) {
  if (items.length === 0) return null

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(listName ? { name: listName } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((it, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: it.name,
      url: it.url,
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
