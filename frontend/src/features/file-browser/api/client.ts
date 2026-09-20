const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    let message = 'Something went wrong while loading your files.'

    try {
      const body = (await response.json()) as { message?: string }
      message = body.message ?? message
    } catch {
      // Use the fallback when an error response is not JSON.
    }

    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<T>
}
