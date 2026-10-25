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

// STUB (RED step): real request logic comes in GREEN.
export async function apiRequest<T>(_path: string, _options: RequestOptions = {}): Promise<T> {
  return undefined as T
}

// STUB (RED step): lets the auth layer react to a rejected token (401).
export function onUnauthorized(_listener: () => void): () => void {
  return () => {}
}
