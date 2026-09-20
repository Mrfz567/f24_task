import { useState, type FormEvent } from 'react'
import { Modal } from '../../../components/ui/Modal'
import type { EntryType } from '../types'

interface EntryFormDialogProps {
  mode: 'create' | 'rename'
  entryType: EntryType
  initialName?: string
  error?: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export function EntryFormDialog({
  mode,
  entryType,
  initialName = '',
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: EntryFormDialogProps) {
  const [name, setName] = useState(initialName)
  const itemLabel = entryType === 'folder' ? 'folder' : 'file'
  const title = mode === 'create' ? `New ${itemLabel}` : `Rename ${itemLabel}`

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (name.trim() !== '') {
      onSubmit(name)
    }
  }

  return (
    <Modal
      description={mode === 'create' && entryType === 'file' ? 'Include the extension in the name, for example report.docx.' : undefined}
      onClose={onClose}
      title={title}
    >
      <form className="mt-6" onSubmit={submit}>
        <label className="text-sm font-medium text-slate-700" htmlFor="entry-name">Name</label>
        <input
          aria-describedby={error === undefined ? undefined : 'entry-name-error'}
          aria-invalid={error !== undefined}
          autoFocus
          className={`mt-2 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
            error === undefined
              ? 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              : 'border-red-400 focus:border-red-500 focus:ring-red-100'
          }`}
          id="entry-name"
          maxLength={255}
          onChange={(event) => setName(event.target.value)}
          placeholder={entryType === 'folder' ? 'Folder name' : 'File name.ext'}
          value={name}
        />
        {error === undefined ? null : (
          <p className="mt-2 text-sm text-red-600" id="entry-name-error">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting || name.trim() === ''}
            type="submit"
          >
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
