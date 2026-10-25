import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, onUnauthorized } from './client'
import { SESSION_KEY } from '../auth/session'
import { fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'

const storeSession = (token: string) => localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: priya }))

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('apiRequest', () => {
  it('calls /api + path and returns the parsed JSON', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [] }))

    const result = await apiRequest('/vehicles')

    expect(requestAt(fetchMock).url).toBe('/api/vehicles')
    expect(requestAt(fetchMock).method).toBe('GET')
    expect(result).toEqual({ vehicles: [] })
  })

  it('sends no Authorization header when logged out', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, {}))

    await apiRequest('/vehicles')

    expect(requestAt(fetchMock).headers.has('Authorization')).toBe(false)
  })

  it('attaches the stored token as "Authorization: Bearer <token>"', async () => {
    const token = fakeToken()
    storeSession(token)
    const fetchMock = fakeFetch(jsonResponse(200, {}))

    await apiRequest('/vehicles')

    expect(requestAt(fetchMock).headers.get('Authorization')).toBe(`Bearer ${token}`)
  })

  it('sends a body as JSON with the method given', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicle: {} }))

    await apiRequest('/vehicles/3/purchase', { method: 'POST', body: { quantity: 1 } })

    const req = requestAt(fetchMock)
    expect(req.method).toBe('POST')
    expect(req.headers.get('Content-Type')).toBe('application/json')
    expect(req.body).toEqual({ quantity: 1 })
  })

  it('returns undefined for 204 No Content (e.g. delete)', async () => {
    fakeFetch(jsonResponse(204))

    await expect(apiRequest('/vehicles/3', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it("throws an ApiError with the status and the server's error message", async () => {
    fakeFetch(jsonResponse(409, { error: 'Out of stock' }))

    const error = await apiRequest('/vehicles/3/purchase', { method: 'POST' }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'Out of stock' })
  })

  it('throws a friendly ApiError when the error response is not JSON (e.g. a proxy page)', async () => {
    fakeFetch(new Response('<html>Bad Gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }))

    const error = await apiRequest('/vehicles').catch((e) => e)

    expect(error).toMatchObject({ status: 502, message: 'Something went wrong. Please try again.' })
  })

  it('throws an ApiError with status 0 when the server cannot be reached', async () => {
    fakeFetch(new TypeError('Failed to fetch'))

    const error = await apiRequest('/vehicles').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 0,
      message: 'Can’t reach the server. Check your connection and try again.',
    })
  })

  it('on 401 with a token: clears the stored session and tells listeners (so the app logs out)', async () => {
    storeSession(fakeToken())
    fakeFetch(jsonResponse(401, { error: 'Invalid or expired token' }))
    const listener = vi.fn()
    const unsubscribe = onUnauthorized(listener)

    await apiRequest('/vehicles').catch(() => {})

    expect(listener).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    unsubscribe()
  })

  it('on 401 without a token (wrong password at login): does not trigger a logout', async () => {
    fakeFetch(jsonResponse(401, { error: 'Invalid email or password' }))
    const listener = vi.fn()
    const unsubscribe = onUnauthorized(listener)

    const error = await apiRequest('/auth/login', { method: 'POST', body: {} }).catch((e) => e)

    expect(error).toMatchObject({ status: 401, message: 'Invalid email or password' })
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})
