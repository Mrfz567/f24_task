import { useEffect, type PropsWithChildren } from 'react'
import { CloseIcon } from './ActionIcons'

interface ModalProps extends PropsWithChildren {
  title: string
  description?: string
  onClose: () => void
}

export function Modal({ title, description, onClose, children }: ModalProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => document.removeEventListener('keydown', closeOnEscape)
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
        aria-describedby={description === undefined ? undefined : 'modal-description'}
        aria-labelledby="modal-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900" id="modal-title">{title}</h2>
            {description === undefined ? null : (
              <p className="mt-1 text-sm leading-6 text-slate-500" id="modal-description">{description}</p>
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
