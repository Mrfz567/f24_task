import { FluentTrash } from '@react-symbols/icons'
import { Modal } from '../../../components/ui/Modal'
import type { Entry } from '../types'

interface DeleteEntryDialogProps {
  entry: Entry
  error?: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteEntryDialog({ entry, error, isDeleting, onClose, onConfirm }: DeleteEntryDialogProps) {
  return (
    <Modal
      description={entry.type === 'folder' ? 'This will also remove every file and subfolder inside it.' : undefined}
      onClose={onClose}
      title={`Delete “${entry.name}”?`}
    >
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
        <FluentTrash aria-hidden="true" height={20} width={20} />
        <p>You will have 10 seconds to undo this action.</p>
      </div>
      {error === undefined ? null : <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isDeleting}
          onClick={onConfirm}
          type="button"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}
