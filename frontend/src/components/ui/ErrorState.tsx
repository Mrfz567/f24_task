import { FluentRefresh, FluentWarning } from '@react-symbols/icons'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry: () => void
}

export function ErrorState({ title = 'We could not load this folder', message, onRetry }: ErrorStateProps) {
  return (
    <section className="grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
          <FluentWarning aria-hidden="true" width={24} height={24} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <button
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          onClick={onRetry}
          type="button"
        >
          <FluentRefresh aria-hidden="true" width={16} height={16} />
          Try again
        </button>
      </div>
    </section>
  )
}
