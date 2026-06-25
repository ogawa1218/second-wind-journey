import Link from "next/link";
import type { Category } from "@/lib/news/rss-fetch";

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
}

export default function CategoryNav({
  categories,
  activeSlug,
}: CategoryNavProps) {
  return (
    <div className="sticky top-[57px] z-40 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 py-3 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/news"
            className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !activeSlug
                ? "bg-[#f97316] text-black"
                : "bg-[#1a1a1a] text-[#a3a3a3] hover:text-white"
            }`}
          >
            すべて
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/news/${cat.slug}`}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeSlug === cat.slug
                  ? "bg-[#f97316] text-black"
                  : "bg-[#1a1a1a] text-[#a3a3a3] hover:text-white"
              }`}
            >
              {cat.emoji} {cat.nameJp}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
