import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_KEY, type SessionUser } from '../auth/session'
import { adminUser, fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { deferred } from '../test/renderWithApp'
import { DashboardPage } from './DashboardPage'

/** A vehicle as GET /api/vehicles returns it. */
function vehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    make: 'Hyundai',
    model: 'i20',
    category: 'Hatchback',
    price: 750000,
    quantity: 5,
    imageUrl: '/cars/hyundai-i20.jpg',
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    ...overrides,
  }
}

const i20 = vehicle()
const mustang = vehicle({ id: 2, make: 'Ford', model: 'Mustang', category: 'Coupe', price: 7500000, quantity: 1, imageUrl: null })
const z4 = vehicle({ id: 3, make: 'BMW', model: 'Z4', category: 'Convertible', price: 9090000, quantity: 0, imageUrl: '/cars/bmw-z4.jpg' })

function logInAs(user: SessionUser = priya) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: fakeToken(3600, user.role), user }))
}

function renderDashboard() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

/** The card (article) for a vehicle, found by its model heading. */
const card = (model: string) => screen.getByRole('heading', { name: model }).closest('article') as HTMLElement

beforeEach(() => {
  localStorage.clear()
  logInAs()
})
afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage — header', () => {
  it('shows the brand, the user’s email and a Log out button', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [] }))
    renderDashboard()

    const banner = screen.getByRole('banner')
    expect(within(banner).getByText('yourGarage')).toBeInTheDocument()
    expect(within(banner).getByText('priya.sharma@gmail.com')).toBeInTheDocument()
    expect(within(banner).getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(within(banner).queryByText('Admin')).not.toBeInTheDocument()
  })

  it('Log out clears the session and goes to /login', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [] }))
    renderDashboard()

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByText('Login page')).toBeInTheDocument()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('shows the ADMIN badge and "Manage inventory" only for an admin', async () => {
    logInAs(adminUser)
    fakeFetch(jsonResponse(200, { vehicles: [] }))
    renderDashboard()

    expect(within(screen.getByRole('banner')).getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Manage inventory')).toBeInTheDocument()
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument()
  })

  it('shows the "Inventory" label and the page heading for a normal user', () => {
    fakeFetch(jsonResponse(200, { vehicles: [] }))
    renderDashboard()

    expect(screen.getByText('Inventory')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Vehicles in stock' })).toBeInTheDocument()
  })
})

describe('DashboardPage — list', () => {
  it('asks the API for the vehicles with the login token', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [i20] }))
    renderDashboard()

    await screen.findByRole('heading', { name: 'i20' })
    const request = requestAt(fetchMock)
    expect(request.url).toBe('/api/vehicles')
    expect(request.method).toBe('GET')
    expect(request.headers.get('Authorization')).toMatch(/^Bearer /)
  })

  it('shows a loading state until the vehicles arrive', async () => {
    const pending = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn(() => pending.promise))
    renderDashboard()

    expect(screen.getByRole('status', { name: 'Loading vehicles' })).toBeInTheDocument()

    pending.resolve(jsonResponse(200, { vehicles: [i20] }))
    expect(await screen.findByRole('heading', { name: 'i20' })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading vehicles' })).not.toBeInTheDocument()
  })

  it('shows "Showing X of Y vehicles"', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [i20, mustang, z4] }))
    renderDashboard()

    expect(await screen.findByText('Showing 3 of 3 vehicles')).toBeInTheDocument()
  })

  it('shows each card’s category, make, model, rupee price and stock', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [i20] }))
    renderDashboard()

    await screen.findByRole('heading', { name: 'i20' })
    const c = within(card('i20'))
    expect(c.getByText('Hatchback')).toBeInTheDocument()
    expect(c.getByText('Hyundai')).toBeInTheDocument()
    expect(c.getByText('₹7,50,000')).toBeInTheDocument()
    expect(c.getByText('5 in stock')).toBeInTheDocument()
    expect(c.getByRole('button', { name: 'Purchase' })).toBeEnabled()
  })

  it('marks a sold-out car and disables its button', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [z4] }))
    renderDashboard()

    await screen.findByRole('heading', { name: 'Z4' })
    const c = within(card('Z4'))
    expect(c.getByText('Sold out', { selector: 'span' })).toBeInTheDocument()
    expect(c.getByText('Out of stock')).toBeInTheDocument()
    expect(c.getByRole('button', { name: 'Sold out' })).toBeDisabled()
    expect(c.queryByRole('button', { name: 'Purchase' })).not.toBeInTheDocument()
  })

  it('marks a car with one left as "Only 1 left"', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [mustang, i20] }))
    renderDashboard()

    await screen.findByRole('heading', { name: 'Mustang' })
    expect(within(card('Mustang')).getByText('Only 1 left')).toBeInTheDocument()
    expect(within(card('Mustang')).getByText('1 in stock')).toBeInTheDocument()
    expect(within(card('i20')).queryByText('Only 1 left')).not.toBeInTheDocument()
  })

  it('shows the car’s photo when it has one', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [i20] }))
    renderDashboard()

    const photo = await screen.findByRole('img', { name: 'Hyundai i20' })
    expect(photo).toHaveAttribute('src', '/cars/hyundai-i20.jpg')
  })

  it('shows the placeholder when a car has no photo', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [mustang] }))
    renderDashboard()

    await screen.findByRole('heading', { name: 'Mustang' })
    const c = within(card('Mustang'))
    expect(c.queryByRole('img', { name: 'Ford Mustang' })).not.toBeInTheDocument()
    expect(c.getByRole('img', { name: 'No photo' })).toBeInTheDocument()
  })

  it('swaps to the placeholder when a photo fails to load', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [i20] }))
    renderDashboard()

    fireEvent.error(await screen.findByRole('img', { name: 'Hyundai i20' }))

    const c = within(card('i20'))
    await waitFor(() => expect(c.queryByRole('img', { name: 'Hyundai i20' })).not.toBeInTheDocument())
    expect(c.getByRole('img', { name: 'No photo' })).toBeInTheDocument()
  })

  it('shows the server’s error in a banner when loading fails', async () => {
    fakeFetch(jsonResponse(500, { error: 'Internal server error' }))
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error')
    expect(screen.queryByRole('status', { name: 'Loading vehicles' })).not.toBeInTheDocument()
  })
})

describe('DashboardPage — empty inventory', () => {
  it('tells a user there are no vehicles yet', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [] }))
    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'No vehicles in stock yet' })).toBeInTheDocument()
    expect(screen.queryByText('Add the first vehicle to get started.')).not.toBeInTheDocument()
  })

  it('gives an admin a hint to add the first vehicle', async () => {
    logInAs(adminUser)
    fakeFetch(jsonResponse(200, { vehicles: [] }))
    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'No vehicles in stock yet' })).toBeInTheDocument()
    expect(screen.getByText('Add the first vehicle to get started.')).toBeInTheDocument()
  })

  it('does not show the empty message when there are vehicles', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [i20] }))
    renderDashboard()

    await screen.findByRole('heading', { name: 'i20' })
    expect(screen.queryByRole('heading', { name: 'No vehicles in stock yet' })).not.toBeInTheDocument()
  })
})
