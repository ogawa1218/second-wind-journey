import SiteHeader from "@/components/blog/site-header";

export default function NewsLoading() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24">
        <div className="py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-[#1a1a1a]" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[#141414]" />
        </div>

        <div className="space-y-14">
          {Array.from({ length: 3 }).map((_, s) => (
            <section key={s}>
              <div className="mb-4 h-5 w-56 animate-pulse rounded bg-[#1a1a1a]" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, c) => (
                  <div
                    key={c}
                    className="flex flex-col gap-3 rounded-xl border border-[#1a1a1a] bg-[#111111] p-4"
                  >
                    <div className="h-5 w-24 animate-pulse rounded-full bg-[#1a1a1a]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[#161616]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#161616]" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#141414]" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
