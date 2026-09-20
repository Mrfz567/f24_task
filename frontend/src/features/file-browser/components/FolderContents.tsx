import { Document, FluentTrash, Folder } from '@react-symbols/icons'
import { useNavigate } from 'react-router-dom'
import { PencilIcon } from '../../../components/ui/ActionIcons'
import type { Entry } from '../types'
import { EmptyFolderState } from './EmptyFolderState'

interface FolderContentsProps {
  entries: Entry[]
  onDelete: (entry: Entry) => void
  onRename: (entry: Entry) => void
}

function formatDate(value: string | null): string {
  if (value === null) {
    return '—'
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function FolderContents({ entries, onDelete, onRename }: FolderContentsProps) {
  const navigate = useNavigate()

  if (entries.length === 0) {
    return <EmptyFolderState />
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed border-collapse text-left">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-[52%] px-5 py-3" scope="col">Name</th>
            <th className="w-1/5 px-5 py-3" scope="col">Type</th>
            <th className="w-1/5 px-5 py-3" scope="col">Modified</th>
            <th className="w-[8%] px-5 py-3 text-right" scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry) => {
            const isFolder = entry.type === 'folder'

            return (
              <tr className="group transition hover:bg-slate-50" key={entry.id}>
                <td className="px-5 py-3.5">
                  {isFolder ? (
                    <button
                      className="flex max-w-full items-center gap-3 rounded text-left font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                      onClick={() => navigate(`/folders/${entry.id}`)}
                      type="button"
                    >
                      <Folder aria-hidden="true" width={25} height={25} />
                      <span className="truncate group-hover:text-blue-700">{entry.name}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 font-medium text-slate-700">
                      <Document aria-hidden="true" width={25} height={25} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm capitalize text-slate-500">{entry.type}</td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(entry.updated_at)}</td>
                <td className="px-5 py-3.5">
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
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
