import { FolderOpen } from '@react-symbols/icons'

export function EmptyFolderState() {
  return (
    <div className="grid min-h-72 place-items-center px-6 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50">
          <FolderOpen aria-hidden="true" width={30} height={30} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-slate-900">This folder is empty</h2>
        <p className="mt-1 text-sm text-slate-500">Folders and files you create will appear here.</p>
      </div>
    </div>
  )
}
