import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'

interface AppShellProps {
  sidebar: ReactNode
  children: ReactNode
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white">{sidebar}</aside>
        <main className="min-w-0 p-8">{children}</main>
      </div>
    </div>
  )
}
