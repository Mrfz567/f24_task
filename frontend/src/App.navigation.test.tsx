import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Entry, FolderEntriesResponse } from './features/file-browser/types'

const root: Entry = {
  id: 'root-id',
  parent_id: null,
  type: 'folder',
  name: 'Root',
  has_children: true,
  children: [],
  created_at: '2026-09-20T08:00:00.000000Z',
  updated_at: '2026-09-20T08:00:00.000000Z',
}

const projects: Entry = {
  ...root,
  id: 'projects-id',
  parent_id: root.id,
  name: 'Projects',
  has_children: false,
}

const notes: Entry = {
  ...root,
  id: 'notes-id',
  parent_id: root.id,
  type: 'file',
  name: 'notes.txt',
  has_children: false,
}

const tree: Entry = {
  ...root,
  children: [projects],
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function folderResponse(folder: Entry, entries: Entry[]): FolderEntriesResponse {
  return {
    data: entries,
    meta: { folder },
  }
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input)

  return new URL(url).pathname
}

function successfulApi(): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const path = requestPath(input)

    if (path.endsWith('/folders/tree')) {
      return jsonResponse({ data: tree })
    }

    if (path.endsWith(`/folders/${root.id}/entries`)) {
      return jsonResponse(folderResponse(root, [projects, notes]))
    }

    if (path.endsWith(`/folders/${projects.id}/entries`)) {
      return jsonResponse(folderResponse(projects, []))
    }

    if (path.endsWith(`/entries/${root.id}/breadcrumbs`)) {
      return jsonResponse({ data: [root] })
    }

    if (path.endsWith(`/entries/${projects.id}/breadcrumbs`)) {
      return jsonResponse({ data: [root, projects] })
    }

    return jsonResponse({ message: 'Not found' }, 404)
  })
}

describe('file browser navigation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/folders')
    vi.stubGlobal('fetch', successfulApi())
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('resolves the base route to Root and renders its contents', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Root' })).toBeInTheDocument()
    expect(window.location.pathname).toBe(`/folders/${root.id}`)
    expect(screen.getByText('notes.txt')).toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()
  })

  it('opens a folder from the contents list and keeps breadcrumbs clickable', async () => {
    const user = userEvent.setup()
    render(<App />)

    const rootContents = await screen.findByRole('region', { name: 'Root contents' })
    await user.click(within(rootContents).getByRole('button', { name: 'Projects' }))

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(window.location.pathname).toBe(`/folders/${projects.id}`)
    expect(screen.getByText('This folder is empty')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Root' }))

    expect(await screen.findByRole('heading', { name: 'Root' })).toBeInTheDocument()
    expect(window.location.pathname).toBe(`/folders/${root.id}`)
  })

  it('supports a direct folder URL and marks it in the sidebar', async () => {
    window.history.replaceState({}, '', `/folders/${projects.id}`)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByLabelText('Breadcrumb')).toHaveTextContent('Root/Projects')
  })

  it('navigates from the folder tree', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    const folderTree = screen.getByRole('navigation', { name: 'Folder tree' })
    await user.click(within(folderTree).getByRole('button', { name: 'Projects' }))

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
  })

  it('shows an API error and can retry the failed request', async () => {
    let rootEntriesAttempts = 0
    const fallbackApi = successfulApi()

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (requestPath(input).endsWith(`/folders/${root.id}/entries`)) {
          rootEntriesAttempts += 1

          if (rootEntriesAttempts <= 2) {
            return jsonResponse({ message: 'The folder is temporarily unavailable.' }, 503)
          }
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    expect(
      await screen.findByText('The folder is temporarily unavailable.', {}, { timeout: 3_000 }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Root' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('The folder is temporarily unavailable.')).not.toBeInTheDocument())
  })
})
