export function LoadingState() {
  return (
    <div aria-label="Loading folder" aria-live="polite" className="animate-pulse space-y-3">
      <div className="h-5 w-52 rounded bg-slate-200" />
      <div className="h-10 w-72 rounded bg-slate-200" />
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="h-12 border-b border-slate-200 bg-slate-50" />
        {[1, 2, 3, 4].map((item) => (
          <div className="flex h-16 items-center gap-4 border-b border-slate-100 px-5 last:border-0" key={item}>
            <div className="size-7 rounded bg-slate-200" />
            <div className="h-4 w-48 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
