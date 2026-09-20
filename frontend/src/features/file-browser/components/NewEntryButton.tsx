import { FluentAdd, FluentNewFile, FluentNewFolder } from '@react-symbols/icons'
import { useEffect, useRef, useState } from 'react'
import type { EntryType } from '../types'

interface NewEntryButtonProps {
  onSelect: (type: EntryType) => void
}

export function NewEntryButton({ onSelect }: NewEntryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeMenu)

    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  function select(type: EntryType) {
    setIsOpen(false)
    onSelect(type)
  }

  return (
    <div className="fixed bottom-8 left-[19rem] z-30" ref={containerRef}>
      {isOpen ? (
        <div className="mb-3 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => select('folder')}
            type="button"
          >
            <FluentNewFolder aria-hidden="true" height={20} width={20} />
            New folder
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => select('file')}
            type="button"
          >
            <FluentNewFile aria-hidden="true" height={20} width={20} />
            New file
          </button>
        </div>
      ) : null}
      <button
        aria-expanded={isOpen}
        aria-haspopup={true}
        className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <FluentAdd aria-hidden="true" height={20} width={20} />
        New
      </button>
    </div>
  )
}
