import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from './AppRoutes'
import { AuthProvider } from './auth/AuthProvider'
import { SESSION_KEY } from './auth/session'
import { fakeToken, priya } from './test/fakes'

/** Shows the current path so tests can see where the guard sent the user. */
function CurrentPath() {
  return <output aria-label="current path">{useLocation().pathname}</output>
}

function renderRoutesAt(path: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <CurrentPath />
      </MemoryRouter>
    </AuthProvider>,
  )
}

const currentPath = () => screen.getByLabelText('current path')

function logInAs(token = fakeToken()) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: priya }))
}

beforeEach(() => localStorage.clear())

describe('routing guards', () => {
  describe('when logged out', () => {
    it('sends / to /login', async () => {
      renderRoutesAt('/')

      expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
      expect(currentPath()).toHaveTextContent(/^\/login$/)
    })

    it('treats an expired stored session as logged out', async () => {
      logInAs(fakeToken(-60))
      renderRoutesAt('/')

      expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
      expect(currentPath()).toHaveTextContent(/^\/login$/)
    })

    it('lets the user open /register', () => {
      renderRoutesAt('/register')

      expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
      expect(currentPath()).toHaveTextContent(/^\/register$/)
    })
  })

  describe('when logged in', () => {
    it('sends /login to the dashboard', async () => {
      logInAs()
      renderRoutesAt('/login')

      expect(await screen.findByLabelText('current path')).toHaveTextContent(/^\/$/)
      expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
    })

    it('sends /register to the dashboard', async () => {
      logInAs()
      renderRoutesAt('/register')

      expect(await screen.findByLabelText('current path')).toHaveTextContent(/^\/$/)
      expect(screen.queryByRole('heading', { name: 'Create your account' })).not.toBeInTheDocument()
    })

    it('stays on the dashboard at /', () => {
      logInAs()
      renderRoutesAt('/')

      expect(currentPath()).toHaveTextContent(/^\/$/)
    })
  })
})
