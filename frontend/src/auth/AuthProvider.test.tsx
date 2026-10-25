import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'
import { SESSION_KEY } from './session'
import { apiRequest } from '../api/client'
import { adminUser, fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'

/** Shows the auth state and offers buttons to drive it, like a tiny app. */
function Probe() {
  const auth = useAuth()
  return (
    <div>
      <p data-testid="user">{auth.user ? `${auth.user.email} (${auth.user.role})` : 'logged out'}</p>
      <p data-testid="admin">{auth.isAdmin ? 'admin' : 'not admin'}</p>
      <button onClick={() => auth.login('priya.sharma@gmail.com', 'SecurePass123').catch(() => {})}>log in</button>
      <button onClick={() => auth.register('priya.sharma@gmail.com', 'SecurePass123').catch(() => {})}>register</button>
      <button onClick={() => auth.logout()}>log out</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
const storeSession = (token: string, user = priya) => localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }))

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('AuthProvider / useAuth', () => {
  it('starts logged out when nothing is stored', () => {
    renderProbe()

    expect(screen.getByTestId('user')).toHaveTextContent('logged out')
  })

  it('login() calls POST /api/auth/login, then exposes and stores the user and token', async () => {
    const token = fakeToken()
    const fetchMock = fakeFetch(jsonResponse(200, { token, user: priya }))
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'log in' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('priya.sharma@gmail.com (USER)'))
    expect(requestAt(fetchMock)).toMatchObject({
      url: '/api/auth/login',
      method: 'POST',
      body: { email: 'priya.sharma@gmail.com', password: 'SecurePass123' },
    })
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual({ token, user: priya })
    expect(screen.getByTestId('admin')).toHaveTextContent('not admin')
  })

  it('isAdmin is true for an ADMIN user', async () => {
    fakeFetch(jsonResponse(200, { token: fakeToken(3600, 'ADMIN'), user: adminUser }))
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'log in' }))

    // Exact match: 'not admin' must not count.
    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent(/^admin$/))
  })

  it('stays logged out when login fails', async () => {
    fakeFetch(jsonResponse(401, { error: 'Invalid email or password' }))
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'log in' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('logged out'))
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('register() creates the account, then logs in with the same details', async () => {
    const token = fakeToken()
    const fetchMock = fakeFetch(jsonResponse(201, { user: priya }), jsonResponse(200, { token, user: priya }))
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'register' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('priya.sharma@gmail.com'))
    expect(requestAt(fetchMock, 0)).toMatchObject({ url: '/api/auth/register', method: 'POST' })
    expect(requestAt(fetchMock, 1)).toMatchObject({ url: '/api/auth/login', method: 'POST' })
  })

  it('stays logged in after a page refresh (session restored from storage)', () => {
    storeSession(fakeToken())

    renderProbe()

    expect(screen.getByTestId('user')).toHaveTextContent('priya.sharma@gmail.com (USER)')
  })

  it('ignores a stored token that has already expired, and clears it', () => {
    storeSession(fakeToken(-60))

    renderProbe()

    expect(screen.getByTestId('user')).toHaveTextContent('logged out')
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('ignores a stored session that is not valid JSON', () => {
    localStorage.setItem(SESSION_KEY, '{not json')

    renderProbe()

    expect(screen.getByTestId('user')).toHaveTextContent('logged out')
  })

  it('logout() forgets the user and clears storage', async () => {
    storeSession(fakeToken())
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'log out' }))

    expect(screen.getByTestId('user')).toHaveTextContent('logged out')
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('logs out when any API call is rejected with 401 (e.g. the token expired mid-session)', async () => {
    storeSession(fakeToken())
    fakeFetch(jsonResponse(401, { error: 'Invalid or expired token' }))
    renderProbe()
    expect(screen.getByTestId('user')).toHaveTextContent('priya.sharma@gmail.com')

    await act(() => apiRequest('/vehicles').catch(() => {}))

    expect(screen.getByTestId('user')).toHaveTextContent('logged out')
  })
})
