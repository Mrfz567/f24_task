import type { ApiResource, Entry, FolderEntriesResponse } from '../types'
import { getJson } from './client'

export async function getFolderTree(): Promise<Entry> {
  const response = await getJson<ApiResource<Entry>>('/folders/tree')

  return response.data
}

export async function getFolderEntries(folderId: string): Promise<FolderEntriesResponse> {
  return getJson<FolderEntriesResponse>(`/folders/${folderId}/entries`)
}

export async function getBreadcrumbs(folderId: string): Promise<Entry[]> {
  const response = await getJson<ApiResource<Entry[]>>(`/entries/${folderId}/breadcrumbs`)

  return response.data
}
