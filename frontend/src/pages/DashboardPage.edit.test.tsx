import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_KEY, type SessionUser } from '../auth/session'
import { adminUser, fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { DashboardPage } from './DashboardPage'

const city = {
  id: 1, make: 'Honda', model: 'City', category: 'Sedan', price: 1250000, quantity: 5, imageUrl: '/cars/honda-city.jpg',
  createdAt: '2026-10-25T00:00:00.000Z', updatedAt: '2026-10-25T00:00:00.000Z',
}

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

const card = () => screen.getByRole('heading', { name: 'City' }).closest('article') as HTMLElement
const dialog = () => screen.getByRole('dialog', { name: 'Edit vehicle' })

async function openEdit() {
  await screen.findByRole('heading', { name: 'City' })
  await userEvent.click(within(card()).getByRole('button', { name: 'Edit' }))
  return within(dialog())
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage — edit vehicle (admin)', () => {
  it('shows Edit on cards only to admins', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [city] }))
    renderDashboard(priya)
    await screen.findByRole('heading', { name: 'City' })

    expect(within(card()).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('opens "Edit vehicle" prefilled, without a Quantity field', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [city] }))
    renderDashboard()

    const d = await openEdit()
    expect(d.getByLabelText('Make')).toHaveValue('Honda')
    expect(d.getByLabelText('Model')).toHaveValue('City')
    expect(d.getByLabelText('Category')).toHaveValue('Sedan')
    expect(d.getByLabelText('Price (₹)')).toHaveValue('1250000')
    expect(d.getByLabelText('Photo URL (optional)')).toHaveValue('/cars/honda-city.jpg')
    expect(d.queryByLabelText('Quantity')).not.toBeInTheDocument()
  })

  it('sends only the changed fields, updates the card and confirms', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [city] }), jsonResponse(200, { vehicle: { ...city, price: 1300000 } }))
    renderDashboard()
    const d = await openEdit()

    await userEvent.clear(d.getByLabelText('Price (₹)'))
    await userEvent.type(d.getByLabelText('Price (₹)'), '1300000')
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Vehicle updated. Honda City has been saved.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(card()).getByText('₹13,00,000')).toBeInTheDocument()
    const request = requestAt(fetchMock, 1)
    expect(request.url).toBe('/api/vehicles/1')
    expect(request.method).toBe('PUT')
    expect(request.body).toEqual({ price: 1300000 })
  })

  it('sends imageUrl: null when the Photo URL is cleared', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [city] }), jsonResponse(200, { vehicle: { ...city, imageUrl: null } }))
    renderDashboard()
    const d = await openEdit()

    await userEvent.clear(d.getByLabelText('Photo URL (optional)'))
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))

    await screen.findByRole('status')
    expect(requestAt(fetchMock, 1).body).toEqual({ imageUrl: null })
    expect(within(card()).getByRole('img', { name: 'No photo' })).toBeInTheDocument()
  })

  it('just closes, sending nothing, when nothing changed', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [city] }))
    renderDashboard()
    const d = await openEdit()

    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('validates like Add and keeps server errors in the dialog', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [city] }), jsonResponse(404, { error: 'Vehicle not found' }))
    renderDashboard()
    const d = await openEdit()

    await userEvent.clear(d.getByLabelText('Make'))
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))
    expect(d.getByLabelText('Make')).toHaveAccessibleDescription('Make is required')

    await userEvent.type(d.getByLabelText('Make'), 'Honda ')
    await userEvent.selectOptions(d.getByLabelText('Category'), 'Hatchback')
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))
    expect(await d.findByRole('alert')).toHaveTextContent('Vehicle not found')
    expect(dialog()).toBeInTheDocument()
  })
})
