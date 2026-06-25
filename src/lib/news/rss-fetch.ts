export interface Category {
  nameJp: string;
  slug: string;
  emoji: string;
  description: string;
  rssUrl: string;
  keywords: string[];
  accentColor: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  pubDateFormatted: string;
  source: string;
  description: string;
  category: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  {
    nameJp: "マラソン・ランニングトレーニング",
    slug: "marathon-training",
    emoji: "🏃",
    description:
      "サブエガ・サブスリーを目指す市民ランナー向けのトレーニング理論・実践記録。インターバル走・閾値走・ロング走など実測データつき。",
    rssUrl:
      "https://news.google.com/rss/search?q=%E3%83%9E%E3%83%A9%E3%82%BD%E3%83%B3%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0+%E3%82%B5%E3%83%96%E3%82%B9%E3%83%AA%E3%83%BC+%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%BC%E3%83%90%E3%83%AB%E8%B5%B0&hl=ja&gl=JP&ceid=JP:ja",
    keywords: [
      "サブエガ練習方法",
      "サブスリー練習メニュー",
      "つくばマラソン攻略",
      "閾値走ペース計算",
      "市民ランナー朝ラン継続",
      "ロング走距離サブエガ",
      "マラソンテンポ走心拍数",
    ],
    accentColor: "text-orange-400",
  },
  {
    nameJp: "睡眠最適化・リカバリー",
    slug: "sleep-recovery",
    emoji: "😴",
    description:
      "アスリートの睡眠負債・早起き習慣・Garmin睡眠スコアの改善方法。疲労回復と翌日のランニングパフォーマンスの関係を実データで検証。",
    rssUrl:
      "https://news.google.com/rss/search?q=%E7%9D%A1%E7%9C%A0%E6%9C%80%E9%81%A9%E5%8C%96+%E3%82%A2%E3%82%B9%E3%83%AA%E3%83%BC%E3%83%88+%E3%83%AA%E3%82%AB%E3%83%90%E3%83%AA%E3%83%BC+%E7%96%B2%E5%8A%B4%E5%9B%9E%E5%BE%A9&hl=ja&gl=JP&ceid=JP:ja",
    keywords: [
      "睡眠負債解消ランナー",
      "早起き習慣化コツ",
      "睡眠スコアGarmin改善",
      "アスリート睡眠時間最適",
      "マラソン疲労回復睡眠",
      "超早起きランニング影響",
      "睡眠の質心拍パフォーマンス",
    ],
    accentColor: "text-blue-400",
  },
  {
    nameJp: "体重・体組成管理",
    slug: "weight-management",
    emoji: "⚖️",
    description:
      "元100kgランナー目線の体重管理・体脂肪コントロール。レース体重64kg達成に向けた減量戦略と、筋肉量を落とさない食事設計を記録。",
    rssUrl:
      "https://news.google.com/rss/search?q=%E3%83%A9%E3%83%B3%E3%83%8A%E3%83%BC+%E4%BD%93%E9%87%8D%E7%AE%A1%E7%90%86+%E4%BD%93%E8%84%82%E8%82%AA+%E6%B8%9B%E9%87%8F+%E3%83%9E%E3%83%A9%E3%82%BD%E3%83%B3&hl=ja&gl=JP&ceid=JP:ja",
    keywords: [
      "100kgからマラソン完走体験",
      "ランナー理想体重計算",
      "マラソン体重1kg何分短縮",
      "有酸素運動体脂肪減らない",
      "ランニング食事減量筋肉",
      "レース体重64kg達成",
      "40代男性ダイエットランニング",
    ],
    accentColor: "text-green-400",
  },
  {
    nameJp: "スポーツ栄養・食事戦略",
    slug: "sports-nutrition",
    emoji: "🥗",
    description:
      "カーボローディング・朝ランの補給戦略・鉄分不足対策など、ランナー向けスポーツ栄養の最新エビデンスを実体験と照合して紹介。",
    rssUrl:
      "https://news.google.com/rss/search?q=%E3%83%9E%E3%83%A9%E3%82%BD%E3%83%B3+%E6%A0%84%E9%A4%8A+%E3%82%AB%E3%83%BC%E3%83%9C%E3%83%AD%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0+%E3%83%97%E3%83%AD%E3%83%86%E3%82%A4%E3%83%B3+%E8%A3%9C%E7%B5%A6&hl=ja&gl=JP&ceid=JP:ja",
    keywords: [
      "マラソンカーボローディングやり方",
      "ランニング朝食食べない効果",
      "マラソンレース中補給食タイミング",
      "アスリート高タンパク低カロリー",
      "ランナー鉄分不足症状改善",
      "糖質制限マラソン合わない理由",
      "朝ラン空腹脂肪燃焼科学的根拠",
    ],
    accentColor: "text-amber-400",
  },
  {
    nameJp: "ウェアラブル・テクノロジー活用",
    slug: "running-tech",
    emoji: "⌚",
    description:
      "GarminデータのVO2max・心拍ゾーン・睡眠スコアを実走データで読み解く。カーボンシューズ選びや最新スポーツテックのレビューも掲載。",
    rssUrl:
      "https://news.google.com/rss/search?q=Garmin+%E3%83%A9%E3%83%B3%E3%83%8B%E3%83%B3%E3%82%B0+%E3%83%87%E3%83%BC%E3%82%BF+%E6%B4%BB%E7%94%A8+%E3%82%AB%E3%83%BC%E3%83%9C%E3%83%B3%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA&hl=ja&gl=JP&ceid=JP:ja",
    keywords: [
      "Garmin心拍ゾーン設定マラソン",
      "VO2max向上トレーニング指標",
      "GarminConnectデータ読み方初心者",
      "アシックスメタスピードスカイレビュー",
      "ノヴァブラスト5練習用評価",
      "ランニングウォッチ睡眠スコア信頼性",
      "心拍数ゾーン2トレーニング効果",
    ],
    accentColor: "text-slate-400",
  },
  {
    nameJp: "メンタル・習慣化・行動科学",
    slug: "habit-mindset",
    emoji: "🧠",
    description:
      "164日チャレンジを支える行動序列ドミノ理論・早起き習慣化・マラソン30kmの壁への対処法。科学的根拠と当事者の実体験を組み合わせて解説。",
    rssUrl:
      "https://news.google.com/rss/search?q=%E7%BF%92%E6%85%A3%E5%8C%96+%E3%83%A9%E3%83%B3%E3%83%8B%E3%83%B3%E3%82%B0+%E7%B6%99%E7%B6%9A+%E8%A1%8C%E5%8B%95%E7%A7%91%E5%AD%A6+%E3%83%A1%E3%83%B3%E3%82%BF%E3%83%AB&hl=ja&gl=JP&ceid=JP:ja",
    keywords: [
      "ランニング習慣化できない理由対策",
      "164日チャレンジ継続記録",
      "行動序列ドミノ睡眠食事運動",
      "早起き習慣やめたい克服",
      "マラソンレース30kmの壁メンタル",
      "退路を断つ目標設定コミットメント",
      "市民ランナーモチベーション回復",
    ],
    accentColor: "text-violet-400",
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Expand CDATA sections: <![CDATA[...]]> → inner text */
function expandCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_match, inner: string) =>
    inner.trim()
  );
}

/** Strip all remaining HTML/XML tags */
function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/** Decode common HTML entities */
function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, code: string) =>
      String.fromCharCode(parseInt(code, 10))
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

/** Clean a raw field value: expand CDATA, strip tags, decode entities, trim */
function cleanField(raw: string): string {
  return decodeEntities(stripTags(expandCdata(raw))).trim();
}

/**
 * Remove frontmatter-style "key: value" lines that sometimes leak into RSS
 * descriptions. A real colon is required after the key so that legitimate prose
 * starting with these words ("Date with destiny…", "Summary of the race…",
 * "Image recognition AI…") is preserved.
 */
function stripFrontmatter(text: string): string {
  return text
    .replace(
      /^(title|description|date|category|tags|author|slug|image|published|summary)\s*:\s*[^\n]*/gim,
      ""
    )
    .replace(/^\[.*?\]$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Extract the text content of the first occurrence of a tag within a block */
function extractTag(block: string, tag: string): string {
  // Match both <tag>...</tag> and self-closed, handling multiline content
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(block);
  return m ? m[1].trim() : "";
}

/** Format an RSS/HTTP date string to Japanese locale short date */
function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Extract the source/publisher name from a Google News RSS item.
 * Google News embeds the source inside <source url="...">Name</source>
 * or as the last token after " - " in the title.
 */
function extractSource(itemBlock: string, title: string): string {
  const sourceTag = extractTag(itemBlock, "source");
  if (sourceTag) return cleanField(sourceTag);
  // Fallback: last segment after " - " in title
  const parts = title.split(" - ");
  if (parts.length > 1) return parts[parts.length - 1].trim();
  return "";
}

/**
 * Google News titles end with " - 媒体名" which is also shown in the card
 * footer. Strip the trailing source from the title to avoid the duplication.
 */
function dedupeSourceFromTitle(title: string, source: string): string {
  if (source && title.endsWith(` - ${source}`)) {
    return title.slice(0, title.length - source.length - 3).trim();
  }
  return title;
}

// ---------------------------------------------------------------------------
// Public parser
// ---------------------------------------------------------------------------

export function parseRSS(xml: string, categorySlug: string): NewsItem[] {
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  const emoji = category?.emoji ?? "";

  // Detect feed format: Atom uses <feed xmlns=…> or <entry>, RSS 2.0 uses <item>
  const isAtom = /<feed[\s>]/.test(xml) || /<entry[\s>]/.test(xml);

  const items: NewsItem[] = [];

  if (isAtom) {
    // --- Atom feed parsing ---
    const entryRe = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    let entryMatch: RegExpExecArray | null;
    while ((entryMatch = entryRe.exec(xml)) !== null) {
      const block = entryMatch[1];

      const rawTitle = extractTag(block, "title");
      const title = cleanField(rawTitle);
      if (!title) continue;

      // <link href="..." /> or <link>...</link>
      let link = "";
      const linkHrefRe = /<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i;
      const linkHrefMatch = linkHrefRe.exec(block);
      if (linkHrefMatch) {
        link = linkHrefMatch[1].trim();
      } else {
        link = cleanField(extractTag(block, "link"));
      }

      const rawPubDate =
        extractTag(block, "published") || extractTag(block, "updated");
      const pubDate = cleanField(rawPubDate);

      const rawDescription =
        extractTag(block, "summary") || extractTag(block, "content");
      const description = stripFrontmatter(cleanField(rawDescription)).slice(0, 200);

      const source = extractSource(block, title);

      items.push({
        title: dedupeSourceFromTitle(title, source),
        link,
        pubDate,
        pubDateFormatted: formatDate(pubDate),
        source,
        description,
        category: categorySlug,
        emoji,
      });
    }
  } else {
    // --- RSS 2.0 feed parsing ---
    const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRe.exec(xml)) !== null) {
      const block = itemMatch[1];

      const rawTitle = extractTag(block, "title");
      const title = cleanField(rawTitle);
      if (!title) continue;

      const rawLink =
        extractTag(block, "link") ||
        // <link> in RSS 2.0 can be text node between tags without closing tag
        (() => {
          const m = /<link>([\s\S]*?)<\/link>/i.exec(block);
          return m ? m[1] : "";
        })();
      const link = cleanField(rawLink);

      const rawPubDate =
        extractTag(block, "pubDate") || extractTag(block, "dc:date");
      const pubDate = cleanField(rawPubDate);

      const rawDescription = extractTag(block, "description");
      const description = stripFrontmatter(cleanField(rawDescription)).slice(0, 200);

      const source = extractSource(block, title);

      items.push({
        title: dedupeSourceFromTitle(title, source),
        link,
        pubDate,
        pubDateFormatted: formatDate(pubDate),
        source,
        description,
        category: categorySlug,
        emoji,
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 8000;

export async function fetchCategoryNews(slug: string): Promise<NewsItem[]> {
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(category.rssUrl, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    return parseRSS(xml, slug);
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAllNews(): Promise<Record<string, NewsItem[]>> {
  const results = await Promise.allSettled(
    CATEGORIES.map((cat) => fetchCategoryNews(cat.slug))
  );

  const newsMap: Record<string, NewsItem[]> = {};
  CATEGORIES.forEach((cat, i) => {
    const result = results[i];
    newsMap[cat.slug] =
      result.status === "fulfilled" ? result.value : [];
  });

  return newsMap;
}
