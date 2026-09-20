import { Document, FluentSearch } from '@react-symbols/icons'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useFileSearch } from '../api/queries'
import type { FileSearchResult } from '../types'

interface FileSearchProps {
  folderId: string | undefined
}

function resultPath(result: FileSearchResult): string {
  return result.breadcrumbs
    .slice(0, -1)
    .map((breadcrumb) => breadcrumb.name)
    .join(' / ')
}

export function FileSearch({ folderId }: FileSearchProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [everywhere, setEverywhere] = useState(false)
  const [exactQuery, setExactQuery] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 300)
  const mode = exactQuery === null ? 'suggestions' : 'exact'
  const activeQuery = exactQuery ?? debouncedQuery
  const searchQuery = useFileSearch(activeQuery, folderId, everywhere, mode)
  const hasQuery = query.trim().length > 0
  const isDebouncing = exactQuery === null && query.trim() !== debouncedQuery.trim()

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)

    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedQuery = query.trim()

    if (normalizedQuery.length === 0) {
      return
    }

    setExactQuery(normalizedQuery)
    setIsOpen(true)
  }

  function openResult(result: FileSearchResult) {
    setIsOpen(false)
    setQuery('')
    setExactQuery(null)
    navigate(`/folders/${result.parent_id}?highlight=${result.id}`)
  }

  const results = searchQuery.data?.data ?? []

  return (
    <div className="flex items-center gap-3">
      <div className="relative min-w-0 flex-1" ref={containerRef}>
        <form onSubmit={submit} role="search">
          <FluentSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            height={18}
            width={18}
          />
          <input
            aria-label="Search files"
            autoComplete="off"
            className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-100"
            onChange={(event) => {
              setQuery(event.target.value)
              setExactQuery(null)
              setIsOpen(event.target.value.trim().length > 0)
            }}
            onFocus={() => setIsOpen(query.trim().length > 0)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsOpen(false)
                event.currentTarget.blur()
              }
            }}
            placeholder={everywhere ? 'Searching everywhere' : 'Search this folder'}
            type="search"
            value={query}
          />
        </form>

        {isOpen && hasQuery ? (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {mode === 'exact' ? 'Search results' : 'Suggestions'}
            </div>
            {isDebouncing || searchQuery.isPending || searchQuery.isFetching ? (
              <p className="px-4 py-5 text-center text-sm text-slate-500">Searching...</p>
            ) : searchQuery.isError ? (
              <p className="px-4 py-5 text-center text-sm text-red-600">{searchQuery.error.message}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-slate-500">
                {mode === 'exact' ? 'No files match that exact name.' : 'No matching files.'}
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
                      onClick={() => openResult(result)}
                      type="button"
                    >
                      <Document aria-hidden="true" className="shrink-0" height={24} width={24} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{result.name}</span>
                        <span className="block truncate text-xs text-slate-500">{resultPath(result)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
        <input
          checked={everywhere}
          className="size-4 rounded border-slate-300 accent-blue-600"
          onChange={(event) => {
            setEverywhere(event.target.checked)
            setExactQuery(null)
            setIsOpen(query.trim().length > 0)
          }}
          type="checkbox"
        />
        Search everywhere
      </label>
    </div>
  )
}
