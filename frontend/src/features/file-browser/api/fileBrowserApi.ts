import type { ApiResource, DeletionBatch, Entry, EntryType, FolderEntriesResponse } from '../types'
import { getJson, sendJson } from './client'

export async function getFolderTree(): Promise<Entry> {
  const response = await getJson<ApiResource<Entry>>('/entries/tree')

  return response.data
}

export async function getFolderEntries(folderId: string): Promise<FolderEntriesResponse> {
  return getJson<FolderEntriesResponse>(`/folders/${folderId}/entries`)
}

export async function getBreadcrumbs(folderId: string): Promise<Entry[]> {
  const response = await getJson<ApiResource<Entry[]>>(`/entries/${folderId}/breadcrumbs`)

  return response.data
}

export async function createEntry(parentId: string, type: EntryType, name: string): Promise<Entry> {
  const response = await sendJson<ApiResource<Entry>>('/entries', 'POST', {
    parent_id: parentId,
    type,
    name,
  })

  return response.data
}

export async function renameEntry(entryId: string, name: string): Promise<Entry> {
  const response = await sendJson<ApiResource<Entry>>(`/entries/${entryId}`, 'PATCH', { name })

  return response.data
}

export async function deleteEntry(entryId: string): Promise<DeletionBatch> {
  const response = await sendJson<ApiResource<DeletionBatch>>(`/entries/${entryId}`, 'DELETE')

  return response.data
}

export async function undoDeletion(token: string): Promise<DeletionBatch> {
  const response = await sendJson<ApiResource<DeletionBatch>>(`/deletions/${token}/undo`, 'POST')

  return response.data
}
