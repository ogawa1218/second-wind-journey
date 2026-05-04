interface Props {
  content: string | null;
  createdAt: string | null;
}

export default function DailyActionPanel({ content, createdAt }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-900 p-6 text-white shadow-sm dark:border-zinc-700">
      <p className="text-xs uppercase tracking-wider text-zinc-400">
        🔥 今日の1アクション
      </p>
      <p className="mt-3 text-base leading-relaxed">
        {content ?? "明日の朝、AIコーチが今日のアクションを生成します。"}
      </p>
      {createdAt && (
        <p className="mt-3 text-xs text-zinc-500">
          {new Date(createdAt).toLocaleString("ja-JP", { hour12: false })}
        </p>
      )}
    </section>
  );
}
