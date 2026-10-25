import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { deferred, renderAt } from '../test/renderWithApp'

const emailField = () => screen.getByLabelText('Email')
const passwordField = () => screen.getByLabelText('Password')
const submitButton = () => screen.getByRole('button', { name: 'Log in' })

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('LoginPage', () => {
  it('shows the brand, heading, fields, tabs and a link to register', () => {
    renderAt('/login')

    expect(screen.getByText('yourGarage')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(emailField()).toBeInTheDocument()
    expect(passwordField()).toHaveAttribute('type', 'password')
    expect(screen.getByRole('tab', { name: 'Log in', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Register' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register')
  })

  it('shows "required" errors and sends nothing when submitted empty', async () => {
    const fetchMock = fakeFetch()
    renderAt('/login')

    await userEvent.click(submitButton())

    expect(emailField()).toHaveAccessibleDescription('Email is required')
    expect(passwordField()).toHaveAccessibleDescription('Password is required')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the design’s message for an invalid email and sends nothing', async () => {
    const fetchMock = fakeFetch()
    renderAt('/login')

    await userEvent.type(emailField(), 'priya.sharma@gmail')
    await userEvent.type(passwordField(), 'SecurePass123')
    await userEvent.click(submitButton())

    expect(emailField()).toHaveAccessibleDescription('Enter a valid email address, like name@example.com')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears a field’s error as soon as the user edits it', async () => {
    fakeFetch()
    renderAt('/login')
    await userEvent.click(submitButton())

    await userEvent.type(passwordField(), 'x')

    expect(passwordField()).not.toHaveAccessibleDescription()
    expect(emailField()).toHaveAccessibleDescription('Email is required')
  })

  it('logs in with the typed details and goes to the dashboard', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { token: fakeToken(), user: priya }))
    renderAt('/login')

    await userEvent.type(emailField(), 'priya.sharma@gmail.com')
    await userEvent.type(passwordField(), 'SecurePass123')
    await userEvent.click(submitButton())

    expect(await screen.findByText('Dashboard placeholder')).toBeInTheDocument()
    expect(requestAt(fetchMock)).toMatchObject({
      url: '/api/auth/login',
      method: 'POST',
      body: { email: 'priya.sharma@gmail.com', password: 'SecurePass123' },
    })
  })

  it('submits when Enter is pressed in the form', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { token: fakeToken(), user: priya }))
    renderAt('/login')

    await userEvent.type(emailField(), 'priya.sharma@gmail.com')
    await userEvent.type(passwordField(), 'SecurePass123{Enter}')

    expect(await screen.findByText('Dashboard placeholder')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows "Logging in…" and disables the button while logging in, so it cannot be submitted twice', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi.fn(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    renderAt('/login')
    await userEvent.type(emailField(), 'priya.sharma@gmail.com')
    await userEvent.type(passwordField(), 'SecurePass123')

    await userEvent.click(submitButton())
    const busyButton = screen.getByRole('button', { name: 'Logging in…' })
    await userEvent.click(busyButton)
    await userEvent.type(passwordField(), '{Enter}')

    expect(busyButton).toBeDisabled()
    expect(busyButton).toHaveAttribute('aria-busy', 'true')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    pending.resolve(jsonResponse(200, { token: fakeToken(), user: priya }))
    expect(await screen.findByText('Dashboard placeholder')).toBeInTheDocument()
  })

  it('shows the server’s error in a banner, keeps the email and lets the user try again', async () => {
    fakeFetch(jsonResponse(401, { error: 'Invalid email or password' }))
    renderAt('/login')

    await userEvent.type(emailField(), 'priya.sharma@gmail.com')
    await userEvent.type(passwordField(), 'WrongPass123')
    await userEvent.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(emailField()).toHaveValue('priya.sharma@gmail.com')
    await waitFor(() => expect(submitButton()).toBeEnabled())
    expect(screen.queryByText('Dashboard placeholder')).not.toBeInTheDocument()
  })
})
