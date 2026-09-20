import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EntryType } from '../types'
import { createEntry, deleteEntry, renameEntry, undoDeletion } from './fileBrowserApi'
import { fileBrowserKeys } from './queries'

function useRefreshFileBrowser() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: fileBrowserKeys.all })
}

export function useCreateEntry() {
  const refresh = useRefreshFileBrowser()

  return useMutation({
    mutationFn: ({ parentId, type, name }: { parentId: string; type: EntryType; name: string }) =>
      createEntry(parentId, type, name),
    onSuccess: refresh,
  })
}

export function useRenameEntry() {
  const refresh = useRefreshFileBrowser()

  return useMutation({
    mutationFn: ({ entryId, name }: { entryId: string; name: string }) => renameEntry(entryId, name),
    onSuccess: refresh,
  })
}

export function useDeleteEntry() {
  const refresh = useRefreshFileBrowser()

  return useMutation({
    mutationFn: (entryId: string) => deleteEntry(entryId),
    onSuccess: refresh,
  })
}

export function useUndoDeletion() {
  const refresh = useRefreshFileBrowser()

  return useMutation({
    mutationFn: (token: string) => undoDeletion(token),
    onSuccess: refresh,
  })
}
