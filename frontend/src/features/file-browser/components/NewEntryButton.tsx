import { FluentAdd, FluentNewFile, FluentNewFolder } from '@react-symbols/icons'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { EntryType } from '../types'

interface NewEntryButtonProps {
  onSelect: (type: EntryType) => void
}

export function NewEntryButton({ onSelect }: NewEntryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)

    if (isOpen) {
      menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    }

    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  function select(type: EntryType) {
    setIsOpen(false)
    triggerRef.current?.focus()
    onSelect(type)
  }

  function moveMenuFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return
    }

    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement)
    let nextIndex = currentIndex

    if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = items.length - 1
    } else if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length
    } else {
      nextIndex = (currentIndex - 1 + items.length) % items.length
    }

    event.preventDefault()
    items[nextIndex]?.focus()
  }

  return (
    <div className="fixed bottom-8 left-[19rem] z-30" ref={containerRef}>
      {isOpen ? (
        <div
          aria-label="Create new"
          className="mb-3 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          onKeyDown={moveMenuFocus}
          ref={menuRef}
          role="menu"
        >
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => select('folder')}
            role="menuitem"
            type="button"
          >
            <FluentNewFolder aria-hidden="true" height={20} width={20} />
            New folder
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => select('file')}
            role="menuitem"
            type="button"
          >
            <FluentNewFile aria-hidden="true" height={20} width={20} />
            New file
          </button>
        </div>
      ) : null}
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <FluentAdd aria-hidden="true" height={20} width={20} />
        New
      </button>
    </div>
  )
}
