import { clearSession, loadSession } from '../auth/session'

/** Error thrown for any failed API call. `status` is 0 when the server couldn't be reached. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Sent as JSON. */
  body?: unknown
}

const UNREACHABLE = 'Can’t reach the server. Check your connection and try again.'
const GENERIC = 'Something went wrong. Please try again.'

/**
 * Where the API lives. Locally "/api" (Vite proxies it to the backend). In production set
 * VITE_API_URL to the backend's address, e.g. https://your-api.onrender.com (a trailing "/" or "/api" is fine).
 */
function apiBase(): string {
  const configured = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  return configured.endsWith('/api') ? configured : `${configured}/api`
}

const unauthorizedListeners = new Set<() => void>()

/** Registers a callback for when the server rejects our token (401). Returns an unsubscribe function. */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

/** Reads `{ error }` from an error response, or falls back to a generic message. */
async function errorMessageFrom(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown }
    if (typeof data?.error === 'string') return data.error
  } catch {
    // not JSON (e.g. a proxy's HTML error page)
  }
  return GENERIC
}

/**
 * Calls the backend at /api + path. Sends the stored token as a Bearer header and bodies as JSON.
 * @returns the parsed JSON body, or undefined for 204 No Content.
 * @throws ApiError with the server's message (status 0 if the server can't be reached).
 */
export async function apiRequest<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const session = loadSession()
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (session) headers.Authorization = `Bearer ${session.token}`

  let response: Response
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, UNREACHABLE)
  }

  // Our token was rejected (expired, user deleted…): forget it and let the app log out.
  // Without a token (e.g. wrong password at login) a 401 is just an error to show.
  if (response.status === 401 && session) {
    clearSession()
    unauthorizedListeners.forEach((listener) => listener())
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessageFrom(response))
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
