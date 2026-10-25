import { vi } from 'vitest'
import type { SessionUser } from '../auth/session'

/** A JSON Response like the backend sends. */
export function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

/** Replaces global fetch with a fake that returns the given responses in order. */
export function fakeFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const r of responses) {
    if (r instanceof Error) fetchMock.mockRejectedValueOnce(r)
    else fetchMock.mockResolvedValueOnce(r)
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The request the fake fetch received on call number `n` (0-based). */
export function requestAt(fetchMock: ReturnType<typeof fakeFetch>, n = 0) {
  const call = fetchMock.mock.calls[n]
  if (!call) throw new Error(`fetch was not called (expected call #${n + 1}, got ${fetchMock.mock.calls.length})`)
  const [url, init = {}] = call
  const headers = new Headers(init.headers)
  return {
    url: String(url),
    method: init.method ?? 'GET',
    headers,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  }
}

/** A token shaped like the backend's (header.payload.signature) expiring `secondsFromNow` from now. */
export function fakeToken(secondsFromNow = 3600, role: 'USER' | 'ADMIN' = 'USER'): string {
  const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const now = Math.floor(Date.now() / 1000)
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: '1', role, iat: now, exp: now + secondsFromNow })}.signature`
}

export const priya: SessionUser = { id: 1, email: 'priya.sharma@gmail.com', role: 'USER', createdAt: '2026-10-25T00:00:00.000Z' }
export const adminUser: SessionUser = { id: 2, email: 'admin@yourgarage.in', role: 'ADMIN', createdAt: '2026-10-25T00:00:00.000Z' }
