import { useQuery } from '@tanstack/react-query'
import { getBreadcrumbs, getFolderEntries, getFolderTree } from './fileBrowserApi'

export const fileBrowserKeys = {
  all: ['file-browser'] as const,
  tree: () => [...fileBrowserKeys.all, 'tree'] as const,
  folder: (folderId: string) => [...fileBrowserKeys.all, 'folder', folderId] as const,
  breadcrumbs: (folderId: string) => [...fileBrowserKeys.all, 'breadcrumbs', folderId] as const,
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
