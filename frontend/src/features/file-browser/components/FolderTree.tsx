import { Folder, FolderOpen } from '@react-symbols/icons'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Entry } from '../types'

interface FolderTreeProps {
  root: Entry
  selectedFolderId?: string
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

export function FolderTree({ root, selectedFolderId }: FolderTreeProps) {
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

  function renderFolder(folder: Entry, depth: number) {
    const isExpanded = visibleExpandedIds.has(folder.id)
    const isSelected = folder.id === selectedFolderId
    const hasChildren = folder.children.length > 0

    return (
      <li key={folder.id}>
        <div
          className={`group flex items-center rounded-lg pr-2 transition ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          <button
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${folder.name}`}
            className={`grid size-7 shrink-0 place-items-center rounded focus-visible:outline-2 focus-visible:outline-blue-600 ${
              hasChildren ? 'visible' : 'invisible'
            }`}
            onClick={() => toggle(folder.id)}
            type="button"
          >
            <span aria-hidden="true" className={`text-[10px] transition ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>
          <button
            aria-current={isSelected ? 'page' : undefined}
            className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => navigate(`/folders/${folder.id}`)}
            type="button"
          >
            {isExpanded ? (
              <FolderOpen aria-hidden="true" width={19} height={19} />
            ) : (
              <Folder aria-hidden="true" width={19} height={19} />
            )}
            <span className="truncate">{folder.name}</span>
          </button>
        </div>
        {hasChildren && isExpanded ? <ul>{folder.children.map((child) => renderFolder(child, depth + 1))}</ul> : null}
      </li>
    )
  }

  return (
    <nav aria-label="Folder tree" className="p-4">
      <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Folders</p>
      <ul>{renderFolder(root, 0)}</ul>
    </nav>
  )
}
