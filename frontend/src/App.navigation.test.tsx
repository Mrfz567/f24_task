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

const brief: Entry = {
  ...notes,
  id: 'brief-id',
  parent_id: projects.id,
  name: 'brief.pdf',
}

const treeProjects: Entry = {
  ...projects,
  has_children: true,
  children: [brief],
}

const tree: Entry = {
  ...root,
  children: [treeProjects],
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

function requestUrl(input: RequestInfo | URL): URL {
  const url = input instanceof Request ? input.url : String(input)

  return new URL(url)
}

function successfulApi(): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const path = requestPath(input)

    if (path.endsWith('/entries/tree')) {
      return jsonResponse({ data: tree })
    }

    if (path.endsWith('/deletions/pending')) {
      return jsonResponse({ data: [], meta: { server_time: new Date().toISOString() } })
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
    window.localStorage.clear()
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

  it('expands a folder to reveal file leaves in the tree', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    const folderTree = screen.getByRole('navigation', { name: 'Folder tree' })
    await user.click(within(folderTree).getByRole('button', { name: 'Expand Projects' }))

    expect(within(folderTree).getByText('brief.pdf')).toBeInTheDocument()
    expect(within(folderTree).queryByRole('button', { name: 'brief.pdf' })).not.toBeInTheDocument()
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

  it('creates a folder from the floating New menu', async () => {
    const fallbackApi = successfulApi()
    let createBody: unknown

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (requestPath(input).endsWith('/entries') && init?.method === 'POST') {
          createBody = JSON.parse(String(init.body))

          return jsonResponse({ data: { ...projects, id: 'created-id', name: 'Client work' } }, 201)
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    await user.click(screen.getByRole('button', { name: 'New' }))
    await user.click(screen.getByRole('menuitem', { name: 'New folder' }))
    await user.type(screen.getByLabelText('Name'), 'Client work')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Client work created')).toBeInTheDocument()
    expect(createBody).toEqual({ parent_id: root.id, type: 'folder', name: 'Client work' })
  })

  it('renames an entry through its pencil action', async () => {
    const fallbackApi = successfulApi()
    let renameBody: unknown

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (requestPath(input).endsWith(`/entries/${notes.id}`) && init?.method === 'PATCH') {
          renameBody = JSON.parse(String(init.body))

          return jsonResponse({ data: { ...notes, name: 'readme.md' } })
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    await user.click(screen.getByRole('button', { name: 'Rename notes.txt' }))
    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'readme.md')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Renamed to readme.md')).toBeInTheDocument()
    expect(renameBody).toEqual({ name: 'readme.md' })
  })

  it('confirms deletion and restores the entry from the Undo toast', async () => {
    const fallbackApi = successfulApi()
    const token = 'deletion-token'
    const pendingDeletion = {
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 10_000).toISOString(),
      already_pending: false,
      already_restored: false,
      root_entry: { id: notes.id, name: notes.name, type: notes.type },
    }
    let undoWasRequested = false

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = requestPath(input)

        if (path.endsWith(`/entries/${notes.id}`) && init?.method === 'DELETE') {
          return jsonResponse({ data: pendingDeletion }, 202)
        }

        if (path.endsWith(`/deletions/${token}/undo`) && init?.method === 'POST') {
          undoWasRequested = true

          return jsonResponse({
            data: { ...pendingDeletion, status: 'restored', already_restored: false },
          })
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    await user.click(screen.getByRole('button', { name: 'Delete notes.txt' }))
    expect(screen.getByRole('dialog', { name: 'Delete “notes.txt”?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('notes.txt deleted')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(await screen.findByText('notes.txt restored')).toBeInTheDocument()
    expect(undoWasRequested).toBe(true)
  })

  it('keeps Undo available while navigating to another folder', async () => {
    const fallbackApi = successfulApi()
    const token = 'navigation-deletion-token'
    const pendingDeletion = {
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 10_000).toISOString(),
      already_pending: false,
      already_restored: false,
      root_entry: { id: notes.id, name: notes.name, type: notes.type },
    }
    let undoWasRequested = false

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = requestPath(input)

        if (path.endsWith(`/entries/${notes.id}`) && init?.method === 'DELETE') {
          return jsonResponse({ data: pendingDeletion }, 202)
        }

        if (path.endsWith(`/deletions/${token}/undo`) && init?.method === 'POST') {
          undoWasRequested = true

          return jsonResponse({ data: { ...pendingDeletion, status: 'restored' } })
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    await user.click(screen.getByRole('button', { name: 'Delete notes.txt' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('notes.txt deleted')).toBeInTheDocument()

    const rootContents = screen.getByRole('region', { name: 'Root contents' })
    await user.click(within(rootContents).getByRole('button', { name: 'Projects' }))

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('notes.txt deleted')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(await screen.findByText('notes.txt restored')).toBeInTheDocument()
    expect(undoWasRequested).toBe(true)
  })

  it('shows backend validation feedback inside the create dialog', async () => {
    const fallbackApi = successfulApi()

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (requestPath(input).endsWith('/entries') && init?.method === 'POST') {
          return jsonResponse({
            message: 'The given data was invalid.',
            errors: { name: ['The name contains an unsupported character.'] },
          }, 422)
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    await user.click(screen.getByRole('button', { name: 'New' }))
    await user.click(screen.getByRole('menuitem', { name: 'New file' }))
    await user.type(screen.getByLabelText('Name'), 'bad/name')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('The name contains an unsupported character.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows scoped suggestions and changes the search scope from the header', async () => {
    const fallbackApi = successfulApi()
    const searchRequests: URL[] = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input)

        if (url.pathname.endsWith('/files/suggestions')) {
          searchRequests.push(url)

          return jsonResponse({
            data: [{ ...notes, breadcrumbs: [root, notes] }],
            meta: {
              query: url.searchParams.get('query'),
              scope: url.searchParams.get('everywhere') === 'true' ? 'everywhere' : 'folder',
              folder_id: url.searchParams.get('folder_id'),
            },
          })
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    const searchInput = screen.getByRole('searchbox', { name: 'Search files' })
    expect(searchInput).toHaveAttribute('placeholder', 'Search this folder')
    await user.type(searchInput, 'not')

    const suggestions = (await screen.findByText('Suggestions')).parentElement!
    expect(
      await within(suggestions).findByRole('button', { name: /notes\.txt/i }),
    ).toBeInTheDocument()
    expect(searchRequests.at(-1)?.searchParams.get('folder_id')).toBe(root.id)
    expect(searchRequests.at(-1)?.searchParams.get('everywhere')).toBe('false')

    await user.click(screen.getByRole('checkbox', { name: 'Search everywhere' }))
    expect(searchInput).toHaveAttribute('placeholder', 'Searching everywhere')

    await waitFor(() => {
      expect(searchRequests.at(-1)?.searchParams.get('everywhere')).toBe('true')
      expect(searchRequests.at(-1)?.searchParams.has('folder_id')).toBe(false)
    })
  })

  it('runs exact search on Enter and opens the result parent with a highlight', async () => {
    const fallbackApi = successfulApi()
    let exactSearchWasRequested = false

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input)

        if (url.pathname.endsWith('/files/search')) {
          exactSearchWasRequested = true

          return jsonResponse({
            data: [{ ...brief, breadcrumbs: [root, projects, brief] }],
            meta: { query: brief.name, scope: 'folder', folder_id: root.id },
          })
        }

        if (url.pathname.endsWith(`/folders/${projects.id}/entries`)) {
          return jsonResponse(folderResponse(projects, [brief]))
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    const searchInput = screen.getByRole('searchbox', { name: 'Search files' })
    await user.type(searchInput, `${brief.name}{Enter}`)

    const result = await screen.findByRole('button', { name: /brief\.pdf/i })
    expect(exactSearchWasRequested).toBe(true)
    expect(result).toHaveTextContent('Root / Projects')
    await user.click(result)

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(window.location.pathname).toBe(`/folders/${projects.id}`)
    expect(window.location.search).toBe(`?highlight=${brief.id}`)
    const projectsContents = screen.getByRole('region', { name: 'Projects contents' })
    expect(within(projectsContents).getByText(brief.name).closest('tr')).toHaveAttribute(
      'data-highlighted',
      'true',
    )
  })

  it('restores a pending Undo timer after a page refresh', async () => {
    const fallbackApi = successfulApi()
    const token = 'recovered-deletion-token'
    const pendingDeletion = {
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 10_000).toISOString(),
      already_pending: false,
      already_restored: false,
      root_entry: { id: notes.id, name: notes.name, type: notes.type },
    }
    let undoWasRequested = false

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = requestPath(input)

        if (path.endsWith('/deletions/pending')) {
          return jsonResponse({
            data: [pendingDeletion],
            meta: { server_time: new Date().toISOString() },
          })
        }

        if (path.endsWith(`/deletions/${token}/undo`) && init?.method === 'POST') {
          undoWasRequested = true

          return jsonResponse({ data: { ...pendingDeletion, status: 'restored' } })
        }

        return fallbackApi(input, init)
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('notes.txt deleted')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(await screen.findByText('notes.txt restored')).toBeInTheDocument()
    expect(undoWasRequested).toBe(true)
  })

  it('switches to grid view and restores the preference after remounting', async () => {
    const user = userEvent.setup()
    render(<App />)

    const rootContents = await screen.findByRole('region', { name: 'Root contents' })
    expect(within(rootContents).getByRole('table')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Grid view' }))

    expect(within(rootContents).queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('f24-file-browser-view')).toBe('"grid"')

    cleanup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('hides only the visual file extension and restores that setting', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    await user.click(screen.getByRole('button', { name: 'Display settings' }))
    const extensionsCheckbox = screen.getByRole('checkbox', { name: 'Show file extensions' })
    expect(extensionsCheckbox).toBeChecked()
    await user.click(extensionsCheckbox)

    const rootContents = screen.getByRole('region', { name: 'Root contents' })
    expect(within(rootContents).getByText('notes')).toBeInTheDocument()
    expect(within(rootContents).queryByText('notes.txt')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rename notes.txt' })).toBeInTheDocument()
    expect(window.localStorage.getItem('f24-show-file-extensions')).toBe('false')

    cleanup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    expect(screen.getByRole('region', { name: 'Root contents' })).toHaveTextContent('notes')
    await user.click(screen.getByRole('button', { name: 'Display settings' }))
    expect(screen.getByRole('checkbox', { name: 'Show file extensions' })).not.toBeChecked()
  })

  it('supports keyboard focus, trapping and dismissal for menus and dialogs', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: 'Root' })
    const newButton = screen.getByRole('button', { name: 'New' })
    await user.click(newButton)
    expect(screen.getByRole('menuitem', { name: 'New folder' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'New file' })).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'New folder' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(newButton).toHaveFocus()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(newButton)
    await user.keyboard('{Enter}')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(newButton).toHaveFocus()

    const settingsButton = screen.getByRole('button', { name: 'Display settings' })
    await user.click(settingsButton)
    expect(screen.getByRole('checkbox', { name: 'Show file extensions' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Display settings' })).not.toBeInTheDocument()
    expect(settingsButton).toHaveFocus()
  })
})
