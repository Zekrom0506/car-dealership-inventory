import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_KEY, type SessionUser } from '../auth/session'
import { adminUser, fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { DashboardPage } from './DashboardPage'

const base = { category: 'SUV', price: 1000000, quantity: 0, imageUrl: null, createdAt: '2026-10-25T00:00:00.000Z', updatedAt: '2026-10-25T00:00:00.000Z' }
const z4 = { ...base, id: 3, make: 'BMW', model: 'Z4', category: 'Convertible' }
const city = { ...base, id: 1, make: 'Honda', model: 'City', category: 'Sedan', quantity: 5 }

function renderDashboard(user: SessionUser = adminUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: fakeToken(3600, user.role), user }))
  render(
    <AuthProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

const dialog = () => screen.getByRole('dialog', { name: 'Delete BMW Z4?' })

async function openDelete() {
  await screen.findByText('Showing 2 of 2 vehicles')
  await userEvent.click(screen.getByRole('button', { name: 'Delete BMW Z4' }))
  return within(dialog())
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage — delete (admin)', () => {
  it('shows the Delete button only to admins', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [z4, city] }))
    renderDashboard(priya)
    await screen.findByText('Showing 2 of 2 vehicles')

    expect(screen.queryByRole('button', { name: 'Delete BMW Z4' })).not.toBeInTheDocument()
  })

  it('asks for confirmation, and Cancel keeps the vehicle', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [z4, city] }))
    renderDashboard()
    const d = await openDelete()

    expect(d.getByText('This removes the vehicle from inventory permanently. This can’t be undone.')).toBeInTheDocument()
    await userEvent.click(d.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Z4' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('deletes, removes the card, updates the count and confirms', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [z4, city] }), new Response(null, { status: 204 }))
    renderDashboard()
    const d = await openDelete()

    await userEvent.click(d.getByRole('button', { name: 'Delete vehicle' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Vehicle deleted. BMW Z4 has been removed.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Z4' })).not.toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 1 vehicles')).toBeInTheDocument()
    const request = requestAt(fetchMock, 1)
    expect(request.url).toBe('/api/vehicles/3')
    expect(request.method).toBe('DELETE')
  })

  it('keeps the dialog open and shows the server’s message when deleting fails', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [z4, city] }), jsonResponse(404, { error: 'Vehicle not found' }))
    renderDashboard()
    const d = await openDelete()

    await userEvent.click(d.getByRole('button', { name: 'Delete vehicle' }))

    expect(await d.findByRole('alert')).toHaveTextContent('Vehicle not found')
    expect(dialog()).toBeInTheDocument()
  })
})
