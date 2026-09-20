import type { ViewMode } from '../hooks/useFileBrowserPreferences'

interface ViewModeToggleProps {
  onChange: (mode: ViewMode) => void
  value: ViewMode
}

function ListIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
      <path d="M3 5h2M8 5h9M3 10h2M8 10h9M3 15h2M8 15h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
      <rect height="5" rx="1" stroke="currentColor" strokeWidth="1.6" width="5" x="3" y="3" />
      <rect height="5" rx="1" stroke="currentColor" strokeWidth="1.6" width="5" x="12" y="3" />
      <rect height="5" rx="1" stroke="currentColor" strokeWidth="1.6" width="5" x="3" y="12" />
      <rect height="5" rx="1" stroke="currentColor" strokeWidth="1.6" width="5" x="12" y="12" />
    </svg>
  )
}

export function ViewModeToggle({ onChange, value }: ViewModeToggleProps) {
  return (
    <div aria-label="View mode" className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group">
      <button
        aria-label="List view"
        aria-pressed={value === 'list'}
        className={`grid size-8 place-items-center rounded-lg transition ${value === 'list' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        onClick={() => onChange('list')}
        title="List view"
        type="button"
      >
        <ListIcon />
      </button>
      <button
        aria-label="Grid view"
        aria-pressed={value === 'grid'}
        className={`grid size-8 place-items-center rounded-lg transition ${value === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        onClick={() => onChange('grid')}
        title="Grid view"
        type="button"
      >
        <GridIcon />
      </button>
    </div>
  )
}
