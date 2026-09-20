import { useCallback, useState } from 'react'
import { ApiError } from '../api/client'
import {
  useCreateEntry,
  useDeleteEntry,
  useRenameEntry,
  useUndoDeletion,
} from '../api/mutations'
import type { DeletionBatch, Entry, EntryType } from '../types'

type DialogState =
  | { kind: 'create'; type: EntryType }
  | { kind: 'delete'; entry: Entry }
  | { kind: 'rename'; entry: Entry }
  | null

interface Notification {
  message: string
  tone: 'error' | 'success'
}

function mutationError(error: Error | null): string | undefined {
  if (error instanceof ApiError && error.errors.name?.[0] !== undefined) {
    return error.errors.name[0]
  }

  return error?.message
}

export function useEntryActions(folderId: string | undefined) {
  const createMutation = useCreateEntry()
  const renameMutation = useRenameEntry()
  const deleteMutation = useDeleteEntry()
  const undoMutation = useUndoDeletion()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deletions, setDeletions] = useState<DeletionBatch[]>([])
  const [notification, setNotification] = useState<Notification | null>(null)

  const closeDialog = useCallback(() => setDialog(null), [])
  const dismissNotification = useCallback(() => setNotification(null), [])
  const removeDeletion = useCallback((token: string) => {
    setDeletions((current) => current.filter((deletion) => deletion.token !== token))
  }, [])

  function openCreateDialog(type: EntryType) {
    createMutation.reset()
    setDialog({ kind: 'create', type })
  }

  function openRenameDialog(entry: Entry) {
    renameMutation.reset()
    setDialog({ kind: 'rename', entry })
  }

  function openDeleteDialog(entry: Entry) {
    deleteMutation.reset()
    setDialog({ kind: 'delete', entry })
  }

  function create(name: string) {
    if (folderId === undefined || dialog?.kind !== 'create') {
      return
    }

    createMutation.mutate(
      { parentId: folderId, type: dialog.type, name },
      {
        onSuccess: (entry) => {
          closeDialog()
          setNotification({ message: `${entry.name} created`, tone: 'success' })
        },
      },
    )
  }

  function rename(name: string) {
    if (dialog?.kind !== 'rename') {
      return
    }

    renameMutation.mutate(
      { entryId: dialog.entry.id, name },
      {
        onSuccess: (entry) => {
          closeDialog()
          setNotification({ message: `Renamed to ${entry.name}`, tone: 'success' })
        },
      },
    )
  }

  function confirmDelete() {
    if (dialog?.kind !== 'delete') {
      return
    }

    deleteMutation.mutate(dialog.entry.id, {
      onSuccess: (deletion) => {
        closeDialog()
        setDeletions((current) => [
          ...current.filter((item) => item.token !== deletion.token),
          deletion,
        ])
      },
    })
  }

  function undo(token: string) {
    undoMutation.mutate(token, {
      onSuccess: (deletion) => {
        removeDeletion(token)
        setNotification({
          message: `${deletion.root_entry?.name ?? 'Item'} restored`,
          tone: 'success',
        })
      },
      onError: (error) => {
        removeDeletion(token)
        setNotification({ message: error.message, tone: 'error' })
      },
    })
  }

  return {
    closeDialog,
    confirmDelete,
    create,
    createError: mutationError(createMutation.error),
    createIsPending: createMutation.isPending,
    deleteError: mutationError(deleteMutation.error),
    deleteIsPending: deleteMutation.isPending,
    deletions,
    dialog,
    dismissNotification,
    notification,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    removeDeletion,
    rename,
    renameError: mutationError(renameMutation.error),
    renameIsPending: renameMutation.isPending,
    undo,
    undoingToken: undoMutation.isPending ? undoMutation.variables : undefined,
  }
}

export type EntryActionsController = ReturnType<typeof useEntryActions>
