import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_KEY, type SessionUser } from '../auth/session'
import { adminUser, fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { DashboardPage } from './DashboardPage'

const city = {
  id: 1, make: 'Honda', model: 'City', category: 'Sedan', price: 1250000, quantity: 5, imageUrl: null,
  createdAt: '2026-10-25T00:00:00.000Z', updatedAt: '2026-10-25T00:00:00.000Z',
}
const nexon = { ...city, id: 2, make: 'Tata', model: 'Nexon', category: 'SUV', price: 900000, quantity: 4 }

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

const dialog = () => screen.getByRole('dialog', { name: 'Add vehicle' })

async function openDialog() {
  await screen.findByText('Showing 1 of 1 vehicles')
  await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }))
  return within(dialog())
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage — add vehicle (admin)', () => {
  it('shows Add vehicle only to admins', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [city] }))
    renderDashboard(priya)
    await screen.findByText('Showing 1 of 1 vehicles')

    expect(screen.queryByRole('button', { name: 'Add vehicle' })).not.toBeInTheDocument()
  })

  it('opens a dialog with the form, and Cancel closes it', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [city] }))
    renderDashboard()

    const d = await openDialog()
    expect(d.getByLabelText('Make')).toBeInTheDocument()
    expect(d.getByLabelText('Model')).toBeInTheDocument()
    expect(within(d.getByLabelText('Category')).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Sedan', 'SUV', 'Hatchback', 'Truck', 'Coupe', 'Convertible', 'Van',
    ])
    expect(d.getByLabelText('Price (₹)')).toBeInTheDocument()
    expect(d.getByLabelText('Quantity')).toHaveAccessibleDescription('Only when adding')
    expect(d.getByLabelText('Photo URL (optional)')).toBeInTheDocument()

    await userEvent.click(d.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each([
    ['everything is empty', {}, { Make: 'Make is required', Model: 'Model is required', 'Price (₹)': 'Price is required', Quantity: 'Quantity is required' }],
    ['price is 0', { 'Price (₹)': '0' }, { 'Price (₹)': 'Price must be above ₹0' }],
    ['price has decimals', { 'Price (₹)': '99.5' }, { 'Price (₹)': 'Price must be a whole number' }],
    ['quantity is negative', { Quantity: '-1' }, { Quantity: 'Quantity must be a whole number of 0 or more' }],
    ['the photo URL is not a link or /path', { 'Photo URL (optional)': 'ftp://x' }, { 'Photo URL (optional)': 'Photo URL must be a link (https://…) or a path starting with /' }],
  ])('shows errors and sends nothing when %s', async (_case, typed: Record<string, string>, expected: Record<string, string>) => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [city] }))
    renderDashboard()
    const d = await openDialog()

    for (const [label, value] of Object.entries(typed)) await userEvent.type(d.getByLabelText(label), value)
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))

    for (const [label, message] of Object.entries(expected)) expect(d.getByLabelText(label)).toHaveAccessibleDescription(message)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('saves the vehicle, closes the dialog, shows it first and confirms', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [city] }), jsonResponse(201, { vehicle: nexon }))
    renderDashboard()
    const d = await openDialog()

    await userEvent.type(d.getByLabelText('Make'), ' Tata ')
    await userEvent.type(d.getByLabelText('Model'), 'Nexon')
    await userEvent.selectOptions(d.getByLabelText('Category'), 'SUV')
    await userEvent.type(d.getByLabelText('Price (₹)'), '900000')
    await userEvent.type(d.getByLabelText('Quantity'), '4')
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Vehicle added. Tata Nexon now has 4 in stock.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Nexon', 'City'])
    expect(screen.getByText('Showing 2 of 2 vehicles')).toBeInTheDocument()
    const request = requestAt(fetchMock, 1)
    expect(request.url).toBe('/api/vehicles')
    expect(request.method).toBe('POST')
    expect(request.body).toEqual({ make: 'Tata', model: 'Nexon', category: 'SUV', price: 900000, quantity: 4, imageUrl: null })
  })

  it.each([
    ['a full link', ' https://images.pexels.com/photos/1/nexon.jpg ', 'https://images.pexels.com/photos/1/nexon.jpg'],
    ['a site path', ' /cars/tata-nexon.jpg', '/cars/tata-nexon.jpg'],
  ])('sends the photo URL trimmed when it is %s', async (_case, typed, sent) => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [city] }), jsonResponse(201, { vehicle: { ...nexon, imageUrl: sent } }))
    renderDashboard()
    const d = await openDialog()

    await userEvent.type(d.getByLabelText('Make'), 'Tata')
    await userEvent.type(d.getByLabelText('Model'), 'Nexon')
    await userEvent.type(d.getByLabelText('Price (₹)'), '900000')
    await userEvent.type(d.getByLabelText('Quantity'), '4')
    await userEvent.type(d.getByLabelText('Photo URL (optional)'), typed)
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))

    await screen.findByRole('status')
    expect(requestAt(fetchMock, 1).body).toMatchObject({ imageUrl: sent })
  })

  it('keeps the dialog open and shows the server’s message when saving fails', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [city] }), jsonResponse(403, { error: 'Admin access required' }))
    renderDashboard()
    const d = await openDialog()

    await userEvent.type(d.getByLabelText('Make'), 'Tata')
    await userEvent.type(d.getByLabelText('Model'), 'Nexon')
    await userEvent.type(d.getByLabelText('Price (₹)'), '900000')
    await userEvent.type(d.getByLabelText('Quantity'), '4')
    await userEvent.click(d.getByRole('button', { name: 'Save vehicle' }))

    expect(await d.findByRole('alert')).toHaveTextContent('Admin access required')
    expect(dialog()).toBeInTheDocument()
  })
})
