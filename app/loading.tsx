function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-[#d9e3df] ${className}`} />;
}

export default function Loading() {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#fffdfa] text-[#15373e]"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading OpenHostel home page</span>

      <nav className="flex h-19 items-center justify-between px-[5.5%]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full bg-[#ed3336]" />
          <Skeleton className="h-5 w-25" />
        </div>
        <div className="hidden items-center gap-7 sm:flex">
          <Skeleton className="h-3 w-19" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-25 rounded-full bg-[#184852]" />
        </div>
        <Skeleton className="h-7 w-8 sm:hidden" />
      </nav>

      <section className="mx-auto grid min-h-165 max-w-360 items-center gap-11 px-[8%] py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <Skeleton className="h-3 w-48" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-14 w-full max-w-130 sm:h-20" />
            <Skeleton className="h-14 w-4/5 max-w-105 sm:h-20" />
          </div>
          <div className="mt-7 space-y-2">
            <Skeleton className="h-4 w-full max-w-105" />
            <Skeleton className="h-4 w-4/5 max-w-90" />
          </div>
          <Skeleton className="mt-8 h-13 w-55 rounded-sm bg-[#ed3336]" />
          <div className="mt-11 flex items-center gap-3">
            <div className="flex">
              <Skeleton className="h-7 w-7 rounded-full bg-[#e28a76]" />
              <Skeleton className="-ml-2 h-7 w-7 rounded-full bg-[#3b6a7b]" />
              <Skeleton className="-ml-2 h-7 w-7 rounded-full bg-[#e4b83a]" />
            </div>
            <Skeleton className="h-7 w-37" />
          </div>
        </div>

        <div className="relative mx-auto h-96 w-full max-w-130 overflow-hidden rounded-t-[48%] rounded-b-xl bg-[#f7ddd2] sm:h-114">
          <div className="absolute right-10 top-12 h-36 w-36 rounded-full bg-[#f5bf5b] sm:h-48 sm:w-48" />
          <div className="absolute -bottom-12 left-4 h-80 w-48 rounded-t-[8rem] bg-[#d36957]" />
          <div className="absolute bottom-0 left-36 h-62 w-47 rounded-t-[8rem] bg-[#e99d78]" />
          <div className="absolute left-1/2 top-1/2 w-67 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#fffefd] p-5 shadow-[0_21px_45px_#583d3642]">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-5 rounded-full bg-[#ed3336]" />
              <Skeleton className="h-3 w-6" />
            </div>
            <Skeleton className="mt-6 h-3 w-20" />
            <Skeleton className="mt-2 h-5 w-46" />
            <Skeleton className="mt-4 h-15 w-full bg-[#e8f1e9]" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Skeleton className="h-15 w-full bg-[#f5f5f1]" />
              <Skeleton className="h-15 w-full bg-[#f5f5f1]" />
            </div>
          </div>
          <Skeleton className="absolute left-5 top-[57%] h-10 w-31 bg-[#fffefa]" />
          <Skeleton className="absolute bottom-[15%] right-5 h-9 w-29 bg-[#fffefa]" />
        </div>
      </section>

      <div className="flex h-13 items-center justify-around bg-[#184852] px-6">
        <Skeleton className="h-3 w-60 bg-[#457078]" />
        <Skeleton className="hidden h-3 w-60 bg-[#457078] sm:block" />
      </div>

      <section className="mx-auto max-w-360 px-[8%] py-20 sm:py-30">
        <Skeleton className="h-3 w-41" />
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-12 w-full sm:h-16" />
            <Skeleton className="h-12 w-4/5 sm:h-16" />
          </div>
          <div className="self-end space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 bg-[#f8efe8] px-[7%] py-[7%] sm:grid-cols-2">
        {["#ed3336", "#184852"].map((color) => (
          <div
            key={color}
            className="relative min-h-75 overflow-hidden p-7"
            style={{ backgroundColor: color }}
          >
            <Skeleton className="h-3 w-43 bg-white/30" />
            <Skeleton className="mt-14 h-8 w-3/4 bg-white/30" />
            <Skeleton className="mt-3 h-8 w-1/2 bg-white/30" />
            <Skeleton className="absolute bottom-7 h-10 w-[calc(100%-3.5rem)] bg-white/25" />
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-360 gap-12 px-[8%] py-20 sm:py-29 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <Skeleton className="h-3 w-45" />
          <Skeleton className="mt-6 h-12 w-52" />
          <Skeleton className="mt-3 h-12 w-39" />
        </div>
        <div className="border-t border-[#bed0cd]">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-4 border-b border-[#bed0cd] py-6">
              <Skeleton className="h-3 w-6" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-100 flex-col items-center justify-center bg-[#ed3336] px-6 text-center">
        <Skeleton className="h-3 w-44 bg-white/30" />
        <Skeleton className="mt-6 h-13 w-70 bg-white/30" />
        <Skeleton className="mt-3 h-13 w-53 bg-white/30" />
        <Skeleton className="mt-7 h-4 w-75 max-w-full bg-white/30" />
        <Skeleton className="mt-8 h-13 w-55 rounded-sm bg-[#fffefa]" />
      </section>

      <footer className="grid gap-7 bg-[#184852] px-[8%] py-12 sm:grid-cols-3">
        <div className="space-y-5">
          <Skeleton className="h-7 w-34 bg-white/25" />
          <Skeleton className="h-9 w-47 bg-white/15" />
        </div>
        <Skeleton className="h-9 w-42 bg-white/15" />
        <div className="space-y-3">
          <Skeleton className="h-3 w-26 bg-white/15" />
          <Skeleton className="h-3 w-17 bg-white/15" />
          <Skeleton className="h-3 w-20 bg-white/15" />
        </div>
      </footer>
    </main>
  );
}
