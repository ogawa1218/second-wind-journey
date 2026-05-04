import Link from "next/link";

export default function HomeNav() {
  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link
        href="/daily"
        className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        今日を記録
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
        >
          ログアウト
        </button>
      </form>
    </nav>
  );
}
