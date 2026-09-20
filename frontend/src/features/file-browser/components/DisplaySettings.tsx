import { FluentGear } from '@react-symbols/icons'
import { useEffect, useRef, useState } from 'react'

interface DisplaySettingsProps {
  onShowFileExtensionsChange: (show: boolean) => void
  showFileExtensions: boolean
}

export function DisplaySettings({
  onShowFileExtensionsChange,
  showFileExtensions,
}: DisplaySettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const checkboxRef = useRef<HTMLInputElement>(null)
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
      checkboxRef.current?.focus()
    }

    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Display settings"
        className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600"
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        title="Display settings"
        type="button"
      >
        <FluentGear aria-hidden="true" height={20} width={20} />
      </button>

      {isOpen ? (
        <div
          aria-label="Display settings"
          className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
          role="dialog"
        >
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Display
          </p>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <input
              checked={showFileExtensions}
              className="size-4 accent-blue-600"
              onChange={(event) => onShowFileExtensionsChange(event.target.checked)}
              ref={checkboxRef}
              type="checkbox"
            />
            Show file extensions
          </label>
        </div>
      ) : null}
    </div>
  )
}
