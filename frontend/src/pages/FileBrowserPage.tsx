import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import {
  useBreadcrumbs,
  useFolderEntries,
  useFolderTree,
} from '../features/file-browser/api/queries'
import { Breadcrumbs } from '../features/file-browser/components/Breadcrumbs'
import { EntryActionOverlays } from '../features/file-browser/components/EntryActionOverlays'
import { FolderContents } from '../features/file-browser/components/FolderContents'
import { FolderTree } from '../features/file-browser/components/FolderTree'
import { NewEntryButton } from '../features/file-browser/components/NewEntryButton'
import { useEntryActions } from '../features/file-browser/hooks/useEntryActions'

function errorMessage(error: Error | null): string {
  return error?.message ?? 'Please check the API connection and try again.'
}

export function FileBrowserPage() {
  const { folderId } = useParams<{ folderId: string }>()
  const navigate = useNavigate()
  const treeQuery = useFolderTree()
  const entriesQuery = useFolderEntries(folderId)
  const breadcrumbsQuery = useBreadcrumbs(folderId)
  const actions = useEntryActions(folderId)

  useEffect(() => {
    if (folderId === undefined && treeQuery.data !== undefined) {
      navigate(`/folders/${treeQuery.data.id}`, { replace: true })
    }
  }, [folderId, navigate, treeQuery.data])

  const sidebar = treeQuery.data === undefined ? (
    <div aria-label="Loading folder tree" className="animate-pulse space-y-3 p-6">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="h-8 rounded bg-slate-100" />
      <div className="ml-4 h-8 rounded bg-slate-100" />
    </div>
  ) : (
    <FolderTree root={treeQuery.data} selectedFolderId={folderId} />
  )

  if (treeQuery.isError) {
    return (
      <AppShell sidebar={sidebar}>
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
      <AppShell sidebar={sidebar}>
        <LoadingState />
      </AppShell>
    )
  }

  if (entriesQuery.isError || breadcrumbsQuery.isError) {
    const failedQuery = entriesQuery.isError ? entriesQuery : breadcrumbsQuery

    return (
      <AppShell sidebar={sidebar}>
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
    <AppShell sidebar={sidebar}>
      <Breadcrumbs entries={breadcrumbsQuery.data} />
      <div className="mt-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{folder.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {entries.length === 1 ? '1 item' : `${entries.length} items`}
        </p>
      </div>
      <section
        aria-label={`${folder.name} contents`}
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <FolderContents
          entries={entries}
          onDelete={actions.openDeleteDialog}
          onRename={actions.openRenameDialog}
        />
      </section>
      <NewEntryButton onSelect={actions.openCreateDialog} />
      <EntryActionOverlays actions={actions} />
    </AppShell>
  )
}
