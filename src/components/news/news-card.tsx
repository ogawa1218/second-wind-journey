import type { NewsItem } from "@/lib/news/rss-fetch";
import { CATEGORIES } from "@/lib/news/rss-fetch";

interface NewsCardProps {
  item: NewsItem;
}

export default function NewsCard({ item }: NewsCardProps) {
  const category = CATEGORIES.find((c) => c.slug === item.category);
  const accentColor = category?.accentColor ?? "text-[#a3a3a3]";
  const truncatedDescription = item.description
    ? item.description.slice(0, 100)
    : "";

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-[#1a1a1a] bg-[#111111] p-4 transition hover:border-[#2a2a2a] hover:bg-[#161616]"
    >
      {/* Header: badge + date + external link icon */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full bg-[#1a1a1a] px-2 py-0.5 text-xs font-semibold ${accentColor}`}
        >
          {item.emoji} {category?.nameJp ?? item.category}
        </span>
        <div className="flex flex-shrink-0 items-center gap-1.5 text-xs text-[#525252]">
          {item.pubDateFormatted && (
            <span>{item.pubDateFormatted}</span>
          )}
          <svg
            className="h-3 w-3 flex-shrink-0 transition group-hover:text-[#a3a3a3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-white">
        {item.title}
      </p>

      {/* Description */}
      {truncatedDescription && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#737373]">
          {truncatedDescription}
        </p>
      )}

      {/* Footer: source */}
      {item.source && (
        <div className="mt-auto border-t border-[#1a1a1a] pt-3">
          <p className="truncate text-xs text-[#525252]">{item.source}</p>
        </div>
      )}
    </a>
  );
}
