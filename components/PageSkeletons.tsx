function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f7f4]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page content</span>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Skeleton className="h-5 w-27 bg-[#234b50]" />
            <div className="hidden gap-5 sm:flex">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-13" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-16 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full bg-[#234b50]" />
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}

export function AuthSkeleton({ recovery = false }: { recovery?: boolean }) {
  return (
    <main className="grid min-h-screen bg-[#f6f3ee] lg:grid-cols-[43%_57%]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading secure access page</span>
      <section className="relative hidden overflow-hidden bg-[#234b50] p-14 lg:block">
        <Skeleton className="h-6 w-32 bg-white/25" />
        <div className="mt-36 space-y-5">
          <Skeleton className="h-3 w-28 bg-[#f4c86a]/50" />
          <Skeleton className="h-16 w-full max-w-105 bg-white/25" />
          <Skeleton className="h-16 w-4/5 bg-white/25" />
          <Skeleton className="h-5 w-4/5 bg-white/15" />
        </div>
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-[#2f666d]" />
      </section>
      <section className="flex items-center justify-center p-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <Skeleton className="h-3 w-30" />
          <Skeleton className="mt-9 h-3 w-28 bg-[#f8e2dc]" />
          <Skeleton className="mt-3 h-10 w-52" />
          {recovery && <Skeleton className="mt-5 h-10 w-full" />}
          <div className="mt-8 space-y-5">
            <div><Skeleton className="h-3 w-25" /><Skeleton className="mt-2 h-12 w-full" /></div>
            {!recovery && <div><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-12 w-full" /></div>}
            <Skeleton className="h-3 w-29 ml-auto" />
            <Skeleton className="h-12 w-full bg-[#d63a36]" />
          </div>
          {!recovery && <Skeleton className="mx-auto mt-7 h-3 w-48" />}
        </div>
      </section>
    </main>
  );
}

export function FormSkeleton({ fields = 4, wide = false }: { fields?: number; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-[#f6f3ee] px-4 py-8 sm:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading form</span>
      <div className={`mx-auto ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <div className="mb-8 flex items-center justify-between"><Skeleton className="h-5 w-30 bg-[#234b50]" /><Skeleton className="h-3 w-35" /></div>
        <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
          <Skeleton className="h-3 w-38 bg-[#f8e2dc]" />
          <Skeleton className="mt-3 h-10 w-3/4" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <div className={`mt-8 grid gap-5 ${wide ? "sm:grid-cols-2" : ""}`}>
            {Array.from({ length: fields }, (_, index) => (
              <div key={index}><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-12 w-full" /></div>
            ))}
          </div>
          <Skeleton className="mt-7 h-12 w-full bg-[#d63a36]" />
        </section>
      </div>
    </main>
  );
}

export function DashboardSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl p-6 sm:p-10">
        <section className="mt-10 rounded-[2rem] bg-[#234b50] p-8 sm:p-14">
          <Skeleton className="h-3 w-37 bg-[#f4c86a]/50" />
          <Skeleton className="mt-5 h-13 w-72 max-w-full bg-white/25 sm:h-18" />
          <div className="mt-8 flex gap-3"><Skeleton className="h-12 w-35 bg-[#d63a36]" /><Skeleton className="h-12 w-40 bg-white/50" /></div>
        </section>
        <section className="mt-7"><Skeleton className="h-3 w-25 bg-[#f8e2dc]" /><Skeleton className="mt-2 h-8 w-35" /><div className="mt-4 grid gap-4 sm:grid-cols-2"><Card /><Card /></div></section>
      </div>
    </AppShell>
  );
}

function Card() {
  return <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"><Skeleton className="h-24 w-full bg-[#f8e2dc]" /><div className="space-y-2 p-4"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-48" /></div></div>;
}

export function ProfileSkeleton() {
  return <AppShell><div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10"><section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"><div className="h-32 bg-[#234b50]" /><div className="px-5 pb-8 sm:px-10"><div className="-mt-14 flex items-end gap-5"><Skeleton className="h-28 w-28 rounded-3xl border-4 border-white bg-[#f4c86a]" /><div className="space-y-2 pb-1"><Skeleton className="h-3 w-22" /><Skeleton className="h-8 w-48" /></div></div><div className="mt-8 grid gap-4 border-t border-slate-100 pt-7 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="rounded-2xl bg-slate-50 p-4"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-5 w-4/5" /></div>)}</div></div></section></div></AppShell>;
}

export function HistorySkeleton() {
  return <AppShell><div className="mx-auto max-w-4xl px-4 py-7 sm:px-8"><Skeleton className="h-3 w-31 bg-[#f8e2dc]" /><Skeleton className="mt-2 h-9 w-60" /><Skeleton className="mt-3 h-4 w-80 max-w-full" /><div className="mt-6 space-y-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-5 w-38" /><Skeleton className="h-3 w-55" /></div><Skeleton className="h-6 w-18 rounded-full" /></div><Skeleton className="mt-4 h-3 w-32" /></div>)}</div></div></AppShell>;
}

export function WorkspaceSkeleton({ admin = false }: { admin?: boolean }) {
  return <AppShell><div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-9">{admin ? <><div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-3 w-35 bg-[#f8e2dc]" /><Skeleton className="h-9 w-47" /></div><Skeleton className="h-12 w-40 bg-[#d63a36]" /></div><div className="mt-7 grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><Skeleton className="h-3 w-27" /><Skeleton className="mt-3 h-8 w-14" /></div>)}</div></> : <section className="rounded-[2rem] bg-[#234b50] px-6 py-8 sm:px-10 sm:py-11"><Skeleton className="h-3 w-42 bg-[#f4c86a]/50" /><Skeleton className="mt-4 h-11 w-60 bg-white/25" /><Skeleton className="mt-4 h-4 w-3/4 bg-white/20" /><Skeleton className="mt-6 h-12 w-35 bg-[#d63a36]" /></section>}<section className="mt-7"><Skeleton className="h-3 w-30 bg-[#f8e2dc]" /><Skeleton className="mt-2 h-8 w-40" /><div className="mt-4 grid gap-5 lg:grid-cols-2"><Card /><Card /></div></section></div></AppShell>;
}

export function MessProfileSkeleton({ manage = false }: { manage?: boolean }) {
  return <AppShell><div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-9">{manage ? <WorkspaceSkeletonBody /> : <><div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-24" /></div><section className="mt-4 rounded-[2rem] bg-[#234b50] p-6 sm:p-10"><Skeleton className="h-3 w-33 bg-[#f4c86a]/50" /><Skeleton className="mt-4 h-14 w-72 max-w-full bg-white/25" /><Skeleton className="mt-5 h-4 w-full max-w-xl bg-white/20" /><Skeleton className="mt-2 h-4 w-4/5 bg-white/20" /></section><div className="mt-5 flex gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11 w-22 rounded-full bg-white" />)}</div></>}<div className="mt-6 grid gap-5 lg:grid-cols-2"><Card /><Card /></div></div></AppShell>;
}

function WorkspaceSkeletonBody() {
  return <section className="rounded-[2rem] bg-[#234b50] p-8"><Skeleton className="h-3 w-42 bg-[#f4c86a]/50" /><Skeleton className="mt-4 h-11 w-60 bg-white/25" /><Skeleton className="mt-4 h-4 w-3/4 bg-white/20" /></section>;
}

export function ConnectionSkeleton() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-4"><section className="w-full max-w-md rounded-[2rem] border border-amber-100 bg-white p-8 text-center shadow-sm"><Skeleton className="mx-auto h-16 w-16 rounded-full bg-amber-100" /><Skeleton className="mx-auto mt-6 h-3 w-36 bg-[#f8e2dc]" /><Skeleton className="mx-auto mt-3 h-9 w-55" /><Skeleton className="mx-auto mt-4 h-4 w-full" /><Skeleton className="mx-auto mt-2 h-4 w-4/5" /><Skeleton className="mt-7 h-12 w-full bg-[#234b50]" /></section></main>;
}
