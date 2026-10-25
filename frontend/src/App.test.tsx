import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  window.history.pushState({}, '', '/')
})

// The real app: router + auth state + routes, opened at / in the browser.
describe('App', () => {
  it('shows the log in page at / when logged out', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })
})
