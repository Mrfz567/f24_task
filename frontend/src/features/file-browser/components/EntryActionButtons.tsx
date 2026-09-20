import { FluentTrash } from '@react-symbols/icons'
import { PencilIcon } from '../../../components/ui/ActionIcons'
import type { Entry } from '../types'

interface EntryActionButtonsProps {
  entry: Entry
  onDelete: (entry: Entry) => void
  onRename: (entry: Entry) => void
}

export function EntryActionButtons({ entry, onDelete, onRename }: EntryActionButtonsProps) {
  return (
    <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100 group-focus-within:opacity-100">
      <button
        aria-label={`Rename ${entry.name}`}
        className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-blue-600"
        onClick={() => onRename(entry)}
        title="Rename"
        type="button"
      >
        <PencilIcon className="size-4" />
      </button>
      <button
        aria-label={`Delete ${entry.name}`}
        className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-red-600"
        onClick={() => onDelete(entry)}
        title="Delete"
        type="button"
      >
        <FluentTrash aria-hidden="true" height={17} width={17} />
      </button>
    </div>
  )
}
