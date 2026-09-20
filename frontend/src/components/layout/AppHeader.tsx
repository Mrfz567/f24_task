import { FolderBlue } from '@react-symbols/icons'
import type { ReactNode } from 'react'

interface AppHeaderProps {
  actions?: ReactNode
  children?: ReactNode
}

export function AppHeader({ actions, children }: AppHeaderProps) {
  return (
    <header className="relative z-40 flex h-16 items-center border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-50">
          <FolderBlue aria-hidden="true" width={24} height={24} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">File browser</p>
          <p className="text-sm font-semibold text-slate-900">F24 File System</p>
        </div>
      </div>
      {children === undefined ? null : (
        <div className="absolute left-1/2 top-1/2 w-[min(38rem,55vw)] -translate-x-1/2 -translate-y-1/2">
          {children}
        </div>
      )}
      {actions === undefined ? null : <div className="ml-auto">{actions}</div>}
    </header>
  )
}
