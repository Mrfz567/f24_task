import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Entry } from '../types'
import { displayedEntryName } from '../utils/fileName'
import { EntryIcon } from './EntryIcon'

interface FolderTreeProps {
  root: Entry
  selectedFolderId?: string
  showFileExtensions: boolean
}

function findAncestorIds(entry: Entry, selectedId: string): string[] | null {
  if (entry.id === selectedId) {
    return [entry.id]
  }

  for (const child of entry.children) {
    const path = findAncestorIds(child, selectedId)

    if (path !== null) {
      return [entry.id, ...path]
    }
  }

  return null
}

export function FolderTree({ root, selectedFolderId, showFileExtensions }: FolderTreeProps) {
  const navigate = useNavigate()
  const selectedPath = useMemo(
    () => (selectedFolderId === undefined ? null : findAncestorIds(root, selectedFolderId)),
    [root, selectedFolderId],
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set([root.id]))
  const visibleExpandedIds = useMemo(
    () => new Set([...expandedIds, ...(selectedPath ?? [])]),
    [expandedIds, selectedPath],
  )

  function toggle(folderId: string) {
    setExpandedIds((current) => {
      const next = new Set(current)

      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }

      return next
    })
  }

  function renderEntry(entry: Entry, depth: number) {
    if (entry.type === 'file') {
      return (
        <li key={entry.id}>
          <div
            className="flex items-center gap-2 rounded-lg py-2 pr-2 text-sm text-slate-500"
            style={{ paddingLeft: `${depth * 16 + 31}px` }}
          >
            <EntryIcon name={entry.name} size={18} type={entry.type} />
            <span className="truncate">
              {displayedEntryName(entry.name, entry.type, showFileExtensions)}
            </span>
          </div>
        </li>
      )
    }

    const isExpanded = visibleExpandedIds.has(entry.id)
    const isSelected = entry.id === selectedFolderId
    const hasChildren = entry.children.length > 0

    return (
      <li key={entry.id}>
        <div
          className={`group flex items-center rounded-lg pr-2 transition ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          <button
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${entry.name}`}
            className={`grid size-7 shrink-0 place-items-center rounded focus-visible:outline-2 focus-visible:outline-blue-600 ${
              hasChildren ? 'visible' : 'invisible'
            }`}
            onClick={() => toggle(entry.id)}
            type="button"
          >
            <span aria-hidden="true" className={`text-[10px] transition ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>
          <button
            aria-current={isSelected ? 'page' : undefined}
            className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => navigate(`/folders/${entry.id}`)}
            type="button"
          >
            <EntryIcon hasChildren={hasChildren} name={entry.name} size={19} type={entry.type} />
            <span className="truncate">{entry.name}</span>
          </button>
        </div>
        {hasChildren && isExpanded ? <ul>{entry.children.map((child) => renderEntry(child, depth + 1))}</ul> : null}
      </li>
    )
  }

  return (
    <nav aria-label="Folder tree" className="p-4">
      <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Folders</p>
      <ul>{renderEntry(root, 0)}</ul>
    </nav>
  )
}
