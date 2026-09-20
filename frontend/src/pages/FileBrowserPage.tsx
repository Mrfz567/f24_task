import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import {
  useBreadcrumbs,
  useFolderEntries,
  useFolderTree,
} from '../features/file-browser/api/queries'
import { Breadcrumbs } from '../features/file-browser/components/Breadcrumbs'
import { DisplaySettings } from '../features/file-browser/components/DisplaySettings'
import { EntryActionOverlays } from '../features/file-browser/components/EntryActionOverlays'
import { FileSearch } from '../features/file-browser/components/FileSearch'
import { FolderContents } from '../features/file-browser/components/FolderContents'
import { FolderTree } from '../features/file-browser/components/FolderTree'
import { NewEntryButton } from '../features/file-browser/components/NewEntryButton'
import { ViewModeToggle } from '../features/file-browser/components/ViewModeToggle'
import { useEntryActions } from '../features/file-browser/hooks/useEntryActions'
import { useFileBrowserPreferences } from '../features/file-browser/hooks/useFileBrowserPreferences'

function errorMessage(error: Error | null): string {
  return error?.message ?? 'Please check the API connection and try again.'
}

export function FileBrowserPage() {
  const { folderId } = useParams<{ folderId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const treeQuery = useFolderTree()
  const entriesQuery = useFolderEntries(folderId)
  const breadcrumbsQuery = useBreadcrumbs(folderId)
  const actions = useEntryActions(folderId)
  const preferences = useFileBrowserPreferences()
  const highlightedEntryId = searchParams.get('highlight') ?? undefined
  const headerContent = (
    <FileSearch folderId={folderId} showFileExtensions={preferences.showFileExtensions} />
  )
  const headerActions = (
    <DisplaySettings
      onShowFileExtensionsChange={preferences.setShowFileExtensions}
      showFileExtensions={preferences.showFileExtensions}
    />
  )

  useEffect(() => {
    if (folderId === undefined && treeQuery.data !== undefined) {
      navigate(`/folders/${treeQuery.data.id}`, { replace: true })
    }
  }, [folderId, navigate, treeQuery.data])

  useEffect(() => {
    if (highlightedEntryId === undefined) {
      return
    }

    const timeout = window.setTimeout(() => {
      const nextParameters = new URLSearchParams(searchParams)
      nextParameters.delete('highlight')
      setSearchParams(nextParameters, { replace: true })
    }, 3_000)

    return () => window.clearTimeout(timeout)
  }, [highlightedEntryId, searchParams, setSearchParams])

  const sidebar = treeQuery.data === undefined ? (
    <div aria-label="Loading folder tree" className="animate-pulse space-y-3 p-6">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="h-8 rounded bg-slate-100" />
      <div className="ml-4 h-8 rounded bg-slate-100" />
    </div>
  ) : (
    <FolderTree
      root={treeQuery.data}
      selectedFolderId={folderId}
      showFileExtensions={preferences.showFileExtensions}
    />
  )

  if (treeQuery.isError) {
    return (
      <AppShell headerActions={headerActions} headerContent={headerContent} sidebar={sidebar}>
        <ErrorState
          message={errorMessage(treeQuery.error)}
          onRetry={() => void treeQuery.refetch()}
          title="We could not load your folders"
        />
      </AppShell>
    )
  }

  if (folderId === undefined || entriesQuery.isPending || breadcrumbsQuery.isPending) {
    return (
      <AppShell headerActions={headerActions} headerContent={headerContent} sidebar={sidebar}>
        <LoadingState />
      </AppShell>
    )
  }

  if (entriesQuery.isError || breadcrumbsQuery.isError) {
    const failedQuery = entriesQuery.isError ? entriesQuery : breadcrumbsQuery

    return (
      <AppShell headerActions={headerActions} headerContent={headerContent} sidebar={sidebar}>
        <ErrorState
          message={errorMessage(failedQuery.error)}
          onRetry={() => void failedQuery.refetch()}
        />
      </AppShell>
    )
  }

  const folder = entriesQuery.data.meta.folder
  const entries = entriesQuery.data.data

  return (
    <AppShell headerActions={headerActions} headerContent={headerContent} sidebar={sidebar}>
      <Breadcrumbs entries={breadcrumbsQuery.data} />
      <div className="mt-5 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{folder.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {entries.length === 1 ? '1 item' : `${entries.length} items`}
          </p>
        </div>
        <ViewModeToggle onChange={preferences.setViewMode} value={preferences.viewMode} />
      </div>
      <section
        aria-label={`${folder.name} contents`}
        className="mt-6"
      >
        <FolderContents
          entries={entries}
          highlightedEntryId={highlightedEntryId}
          onDelete={actions.openDeleteDialog}
          onRename={actions.openRenameDialog}
          showFileExtensions={preferences.showFileExtensions}
          viewMode={preferences.viewMode}
        />
      </section>
      <NewEntryButton onSelect={actions.openCreateDialog} />
      <EntryActionOverlays actions={actions} />
    </AppShell>
  )
}
