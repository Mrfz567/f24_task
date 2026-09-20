export type EntryType = 'file' | 'folder'

export interface Entry {
  id: string
  parent_id: string | null
  type: EntryType
  name: string
  has_children: boolean
  children: Entry[]
  created_at: string | null
  updated_at: string | null
}

export interface ApiResource<T> {
  data: T
}

export interface FolderEntriesResponse extends ApiResource<Entry[]> {
  meta: {
    folder: Entry
  }
}

export interface DeletionBatch {
  token: string
  status: 'pending' | 'restored' | 'purged'
  expires_at: string
  already_pending: boolean
  already_restored: boolean
  root_entry: Pick<Entry, 'id' | 'name' | 'type'> | null
}

export interface PendingDeletionsResponse extends ApiResource<DeletionBatch[]> {
  meta: {
    server_time: string
  }
}

export interface SearchBreadcrumb {
  id: string
  name: string
  type: EntryType
}

export interface FileSearchResult {
  id: string
  parent_id: string
  type: 'file'
  name: string
  breadcrumbs: SearchBreadcrumb[]
  created_at: string | null
  updated_at: string | null
}

export interface FileSearchResponse extends ApiResource<FileSearchResult[]> {
  meta: {
    query: string
    scope: 'folder' | 'everywhere'
    folder_id: string | null
  }
}
