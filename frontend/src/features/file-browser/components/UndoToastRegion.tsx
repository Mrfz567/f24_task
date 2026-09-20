import { FluentTrash } from '@react-symbols/icons'
import { useEffect, useState } from 'react'
import type { DeletionBatch } from '../types'

interface UndoToastRegionProps {
  deletions: DeletionBatch[]
  undoingToken?: string
  onExpire: (token: string) => void
  onUndo: (token: string) => void
}

interface UndoToastProps {
  deletion: DeletionBatch
  isUndoing: boolean
  onExpire: (token: string) => void
  onUndo: (token: string) => void
}

function UndoToast({ deletion, isUndoing, onExpire, onUndo }: UndoToastProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((Date.parse(deletion.expires_at) - Date.now()) / 1_000)),
  )

  useEffect(() => {
    function updateTimer() {
      const remaining = Math.max(0, Math.ceil((Date.parse(deletion.expires_at) - Date.now()) / 1_000))
      setRemainingSeconds(remaining)

      if (remaining === 0) {
        onExpire(deletion.token)
      }
    }

    const interval = window.setInterval(updateTimer, 250)

    return () => window.clearInterval(interval)
  }, [deletion.expires_at, deletion.token, onExpire])

  return (
    <div className="w-80 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl">
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-500/15 text-red-300">
          <FluentTrash aria-hidden="true" height={19} width={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{deletion.root_entry?.name ?? 'Item'} deleted</p>
          <p className="mt-0.5 text-xs text-slate-300">Permanent in {remainingSeconds}s</p>
        </div>
        <button
          className="self-center rounded-lg px-2 py-1 text-sm font-semibold text-blue-300 transition hover:bg-white/10 hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-blue-300 disabled:opacity-50"
          disabled={isUndoing || remainingSeconds === 0}
          onClick={() => onUndo(deletion.token)}
          type="button"
        >
          {isUndoing ? 'Restoring…' : 'Undo'}
        </button>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-blue-400 transition-[width] duration-200"
          style={{ width: `${Math.min(100, remainingSeconds * 10)}%` }}
        />
      </div>
    </div>
  )
}

export function UndoToastRegion({ deletions, undoingToken, onExpire, onUndo }: UndoToastRegionProps) {
  if (deletions.length === 0) {
    return null
  }

  return (
    <section aria-label="Pending deletions" className="fixed bottom-6 right-6 z-[60] space-y-3">
      {deletions.map((deletion) => (
        <UndoToast
          deletion={deletion}
          isUndoing={undoingToken === deletion.token}
          key={deletion.token}
          onExpire={onExpire}
          onUndo={onUndo}
        />
      ))}
    </section>
  )
}
