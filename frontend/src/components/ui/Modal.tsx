import { useEffect, useId, useRef, type PropsWithChildren } from 'react'
import { CloseIcon } from './ActionIcons'

interface ModalProps extends PropsWithChildren {
  title: string
  description?: string
  onClose: () => void
}

export function Modal({ title, description, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement
    const dialog = dialogRef.current
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    if (dialog !== null) {
      const initialFocus = dialog.querySelector<HTMLElement>('[data-autofocus]')
        ?? dialog.querySelector<HTMLElement>(focusableSelector)
      initialFocus?.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || dialog === null) {
        return
      }

      const focusableElements = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)!

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocusedElement instanceof HTMLElement && previouslyFocusedElement.isConnected) {
        previouslyFocusedElement.focus()
      }
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-describedby={description === undefined ? undefined : descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900" id={titleId}>{title}</h2>
            {description === undefined ? null : (
              <p className="mt-1 text-sm leading-6 text-slate-500" id={descriptionId}>{description}</p>
            )}
          </div>
          <button
            aria-label="Close dialog"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
