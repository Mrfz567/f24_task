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
