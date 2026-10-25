import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { deferred, renderAt } from '../test/renderWithApp'

const emailField = () => screen.getByLabelText('Email')
const passwordField = () => screen.getByLabelText('Password')
const confirmField = () => screen.getByLabelText('Confirm password')
const submitButton = () => screen.getByRole('button', { name: 'Create account' })

/** Fills the form with valid details (each field can be overridden). */
async function fillForm(overrides: { email?: string; password?: string; confirm?: string } = {}) {
  const { email = 'priya.sharma@gmail.com', password = 'SecurePass123' } = overrides
  const confirm = overrides.confirm ?? password
  if (email) await userEvent.type(emailField(), email)
  if (password) await userEvent.type(passwordField(), password)
  if (confirm) await userEvent.type(confirmField(), confirm)
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('RegisterPage', () => {
  it('shows the brand, heading, three fields, tabs and a link to log in', () => {
    renderAt('/register')

    expect(screen.getByText('yourGarage')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(passwordField()).toHaveAttribute('type', 'password')
    expect(confirmField()).toHaveAttribute('type', 'password')
    expect(screen.getByRole('tab', { name: 'Register', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Log in' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })

  it.each([
    ['the email is invalid', { email: 'priya.sharma@gmail' }, 'Email', 'Enter a valid email address, like name@example.com'],
    ['the password is shorter than 8 characters', { password: 'abc12' }, 'Password', 'Use at least 8 characters'],
    ['the passwords don’t match', { confirm: 'abc123456' }, 'Confirm password', 'Passwords don’t match'],
    ['the confirmation is empty', { confirm: '' }, 'Confirm password', 'Passwords don’t match'],
  ])('shows an error and sends nothing when %s', async (_case, overrides, field, message) => {
    const fetchMock = fakeFetch()
    renderAt('/register')

    await fillForm(overrides)
    await userEvent.click(submitButton())

    expect(screen.getByLabelText(field)).toHaveAccessibleDescription(message)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('creates the account, logs in and goes to the dashboard', async () => {
    const fetchMock = fakeFetch(jsonResponse(201, { user: priya }), jsonResponse(200, { token: fakeToken(), user: priya }))
    renderAt('/register')

    await fillForm()
    await userEvent.click(submitButton())

    expect(await screen.findByText('Dashboard placeholder')).toBeInTheDocument()
    expect(requestAt(fetchMock, 0)).toMatchObject({
      url: '/api/auth/register',
      method: 'POST',
      body: { email: 'priya.sharma@gmail.com', password: 'SecurePass123' },
    })
  })

  it('submits when Enter is pressed in the form', async () => {
    const fetchMock = fakeFetch(jsonResponse(201, { user: priya }), jsonResponse(200, { token: fakeToken(), user: priya }))
    renderAt('/register')

    await fillForm({ confirm: '' })
    await userEvent.type(confirmField(), 'SecurePass123{Enter}')

    expect(await screen.findByText('Dashboard placeholder')).toBeInTheDocument()
    expect(requestAt(fetchMock, 0).url).toBe('/api/auth/register')
  })

  it('disables the button while creating the account, so it cannot be submitted twice', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi.fn(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    renderAt('/register')
    await fillForm()

    await userEvent.click(submitButton())
    await userEvent.click(submitButton())

    expect(submitButton()).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows the server’s error in a banner (e.g. email already registered)', async () => {
    fakeFetch(jsonResponse(409, { error: 'Email is already registered' }))
    renderAt('/register')

    await fillForm()
    await userEvent.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered')
    expect(screen.queryByText('Dashboard placeholder')).not.toBeInTheDocument()
  })
})
