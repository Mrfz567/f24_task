import type { EntryActionsController } from '../hooks/useEntryActions'
import { DeleteEntryDialog } from './DeleteEntryDialog'
import { EntryFormDialog } from './EntryFormDialog'
import { NotificationToast } from './NotificationToast'
import { UndoToastRegion } from './UndoToastRegion'

interface EntryActionOverlaysProps {
  actions: EntryActionsController
}

export function EntryActionOverlays({ actions }: EntryActionOverlaysProps) {
  return (
    <>
      {actions.dialog?.kind === 'create' ? (
        <EntryFormDialog
          entryType={actions.dialog.type}
          error={actions.createError}
          isSubmitting={actions.createIsPending}
          mode="create"
          onClose={actions.closeDialog}
          onSubmit={actions.create}
        />
      ) : null}
      {actions.dialog?.kind === 'rename' ? (
        <EntryFormDialog
          entryType={actions.dialog.entry.type}
          error={actions.renameError}
          initialName={actions.dialog.entry.name}
          isSubmitting={actions.renameIsPending}
          mode="rename"
          onClose={actions.closeDialog}
          onSubmit={actions.rename}
        />
      ) : null}
      {actions.dialog?.kind === 'delete' ? (
        <DeleteEntryDialog
          entry={actions.dialog.entry}
          error={actions.deleteError}
          isDeleting={actions.deleteIsPending}
          onClose={actions.closeDialog}
          onConfirm={actions.confirmDelete}
        />
      ) : null}
      <UndoToastRegion
        deletions={actions.deletions}
        onExpire={actions.removeDeletion}
        onUndo={actions.undo}
        serverTimeOffsetMs={actions.serverTimeOffsetMs}
        undoingToken={actions.undoingToken}
      />
      {actions.notification === null ? null : (
        <NotificationToast
          message={actions.notification.message}
          onDismiss={actions.dismissNotification}
          tone={actions.notification.tone}
        />
      )}
    </>
  )
}
