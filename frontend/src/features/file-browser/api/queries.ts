import { useQuery } from '@tanstack/react-query'
import {
  getBreadcrumbs,
  getFolderEntries,
  getFolderTree,
  getPendingDeletions,
  searchFiles,
} from './fileBrowserApi'

export const fileBrowserKeys = {
  all: ['file-browser'] as const,
  tree: () => [...fileBrowserKeys.all, 'tree'] as const,
  folder: (folderId: string) => [...fileBrowserKeys.all, 'folder', folderId] as const,
  breadcrumbs: (folderId: string) => [...fileBrowserKeys.all, 'breadcrumbs', folderId] as const,
  pendingDeletions: () => [...fileBrowserKeys.all, 'pending-deletions'] as const,
  search: (
    mode: 'exact' | 'suggestions',
    query: string,
    folderId: string | undefined,
    everywhere: boolean,
  ) => [...fileBrowserKeys.all, 'search', mode, query, folderId ?? null, everywhere] as const,
}

export function useFolderTree() {
  return useQuery({ queryKey: fileBrowserKeys.tree(), queryFn: getFolderTree })
}

export function useFolderEntries(folderId: string | undefined) {
  return useQuery({
    queryKey: fileBrowserKeys.folder(folderId ?? ''),
    queryFn: () => getFolderEntries(folderId!),
    enabled: folderId !== undefined,
  })
}

export function useBreadcrumbs(folderId: string | undefined) {
  return useQuery({
    queryKey: fileBrowserKeys.breadcrumbs(folderId ?? ''),
    queryFn: () => getBreadcrumbs(folderId!),
    enabled: folderId !== undefined,
  })
}

export function usePendingDeletions() {
  return useQuery({
    queryKey: fileBrowserKeys.pendingDeletions(),
    queryFn: ({ signal }) => getPendingDeletions(signal),
  })
}

export function useFileSearch(
  query: string,
  folderId: string | undefined,
  everywhere: boolean,
  mode: 'exact' | 'suggestions',
) {
  const normalizedQuery = query.trim()

  return useQuery({
    queryKey: fileBrowserKeys.search(mode, normalizedQuery, folderId, everywhere),
    queryFn: ({ signal }) => searchFiles(normalizedQuery, folderId, everywhere, mode, signal),
    enabled: normalizedQuery.length > 0 && (everywhere || folderId !== undefined),
    staleTime: 0,
  })
}
