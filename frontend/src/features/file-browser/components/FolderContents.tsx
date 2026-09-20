import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ViewMode } from '../hooks/useFileBrowserPreferences'
import type { Entry } from '../types'
import { displayedEntryName } from '../utils/fileName'
import { EmptyFolderState } from './EmptyFolderState'
import { EntryActionButtons } from './EntryActionButtons'
import { EntryIcon } from './EntryIcon'

interface FolderContentsProps {
  entries: Entry[]
  highlightedEntryId?: string
  onDelete: (entry: Entry) => void
  onRename: (entry: Entry) => void
  showFileExtensions: boolean
  viewMode: ViewMode
}

interface EntryViewProps extends Omit<FolderContentsProps, 'viewMode'> {
  onOpenFolder: (folderId: string) => void
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

function EntryName({ entry, showFileExtensions }: { entry: Entry; showFileExtensions: boolean }) {
  return displayedEntryName(entry.name, entry.type, showFileExtensions)
}

function FolderList({
  entries,
  highlightedEntryId,
  onDelete,
  onOpenFolder,
  onRename,
  showFileExtensions,
}: EntryViewProps) {
  const highlightedRowRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    highlightedRowRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [highlightedEntryId])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
            const isHighlighted = entry.id === highlightedEntryId

            return (
              <tr
                className={`group transition ${isHighlighted ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : 'hover:bg-slate-50'}`}
                data-highlighted={isHighlighted ? 'true' : undefined}
                key={entry.id}
                ref={isHighlighted ? highlightedRowRef : undefined}
              >
                <td className="px-5 py-3.5">
                  {isFolder ? (
                    <button
                      className="flex max-w-full items-center gap-3 rounded text-left font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                      onClick={() => onOpenFolder(entry.id)}
                      type="button"
                    >
                      <EntryIcon hasChildren={entry.has_children} name={entry.name} size={25} type={entry.type} />
                      <span className="truncate group-hover:text-blue-700">
                        <EntryName entry={entry} showFileExtensions={showFileExtensions} />
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 font-medium text-slate-700">
                      <EntryIcon name={entry.name} size={25} type={entry.type} />
                      <span className="truncate">
                        <EntryName entry={entry} showFileExtensions={showFileExtensions} />
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm capitalize text-slate-500">{entry.type}</td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(entry.updated_at)}</td>
                <td className="px-5 py-3.5">
                  <EntryActionButtons entry={entry} onDelete={onDelete} onRename={onRename} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FolderGrid({
  entries,
  highlightedEntryId,
  onDelete,
  onOpenFolder,
  onRename,
  showFileExtensions,
}: EntryViewProps) {
  const highlightedCardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    highlightedCardRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [highlightedEntryId])

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
      {entries.map((entry) => {
        const isFolder = entry.type === 'folder'
        const isHighlighted = entry.id === highlightedEntryId
        const content = (
          <>
            <span className="grid size-16 place-items-center rounded-2xl bg-slate-50">
              <EntryIcon hasChildren={entry.has_children} name={entry.name} size={42} type={entry.type} />
            </span>
            <span className="mt-4 block w-full truncate text-sm font-semibold text-slate-800">
              <EntryName entry={entry} showFileExtensions={showFileExtensions} />
            </span>
            <span className="mt-1 block text-xs capitalize text-slate-500">{entry.type}</span>
          </>
        )

        return (
          <article
            className={`group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isHighlighted ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'}`}
            data-highlighted={isHighlighted ? 'true' : undefined}
            key={entry.id}
            ref={isHighlighted ? highlightedCardRef : undefined}
          >
            {isFolder ? (
              <button
                className="flex w-full flex-col items-center rounded-xl text-center focus-visible:outline-2 focus-visible:outline-blue-600"
                onClick={() => onOpenFolder(entry.id)}
                type="button"
              >
                {content}
              </button>
            ) : (
              <div className="flex w-full flex-col items-center text-center">{content}</div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400">{formatDate(entry.updated_at)}</span>
              <EntryActionButtons entry={entry} onDelete={onDelete} onRename={onRename} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function FolderContents({
  entries,
  highlightedEntryId,
  onDelete,
  onRename,
  showFileExtensions,
  viewMode,
}: FolderContentsProps) {
  const navigate = useNavigate()

  if (entries.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <EmptyFolderState />
      </div>
    )
  }

  const sharedProps: EntryViewProps = {
    entries,
    highlightedEntryId,
    onDelete,
    onOpenFolder: (folderId) => navigate(`/folders/${folderId}`),
    onRename,
    showFileExtensions,
  }

  return viewMode === 'list' ? <FolderList {...sharedProps} /> : <FolderGrid {...sharedProps} />
}
