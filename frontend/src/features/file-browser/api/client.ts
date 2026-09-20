const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  })

  if (!response.ok) {
    let message = 'Something went wrong while loading your files.'
    let errors: Record<string, string[]> = {}

    try {
      const body = (await response.json()) as {
        message?: string
        errors?: Record<string, string[]>
      }
      message = body.message ?? message
      errors = body.errors ?? {}
    } catch {
      // Use the fallback when an error response is not JSON.
    }

    throw new ApiError(message, response.status, errors)
  }

  return response.json() as Promise<T>
}

export function getJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  return requestJson<T>(path, init)
}

export function sendJson<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  return requestJson<T>(path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
