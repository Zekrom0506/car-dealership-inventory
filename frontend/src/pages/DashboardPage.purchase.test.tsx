import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_KEY } from '../auth/session'
import { fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { deferred } from '../test/renderWithApp'
import { DashboardPage } from './DashboardPage'

const i20 = {
  id: 7, make: 'Hyundai', model: 'i20', category: 'Hatchback', price: 750000, quantity: 6, imageUrl: null,
  createdAt: '2026-10-25T00:00:00.000Z', updatedAt: '2026-10-25T00:00:00.000Z',
}

function renderDashboard() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: fakeToken(), user: priya }))
  render(
    <AuthProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

const card = () => screen.getByRole('heading', { name: 'i20' }).closest('article') as HTMLElement

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage — purchase', () => {
  it('buys one, shows the confirmation and updates the stock', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [i20] }), jsonResponse(200, { vehicle: { ...i20, quantity: 5 } }))
    renderDashboard()
    await screen.findByRole('heading', { name: 'i20' })

    await userEvent.click(within(card()).getByRole('button', { name: 'Purchase' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Purchase confirmed. Hyundai i20 is yours — 5 left in stock.')
    expect(within(card()).getByText('5 in stock')).toBeInTheDocument()
    const request = requestAt(fetchMock, 1)
    expect(request.url).toBe('/api/vehicles/7/purchase')
    expect(request.method).toBe('POST')
  })

  it('turns the card into Sold out after buying the last one', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [{ ...i20, quantity: 1 }] }), jsonResponse(200, { vehicle: { ...i20, quantity: 0 } }))
    renderDashboard()
    await screen.findByRole('heading', { name: 'i20' })

    await userEvent.click(within(card()).getByRole('button', { name: 'Purchase' }))

    expect(await within(card()).findByRole('button', { name: 'Sold out' })).toBeDisabled()
    expect(within(card()).getByText('Out of stock')).toBeInTheDocument()
  })

  it('sends only one request while a purchase is in progress', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, { vehicles: [i20] }))
      .mockReturnValueOnce(pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    renderDashboard()
    await screen.findByRole('heading', { name: 'i20' })

    const button = within(card()).getByRole('button', { name: 'Purchase' })
    await userEvent.click(button)
    await userEvent.click(button)

    expect(within(card()).getByRole('button', { name: 'Purchasing…' })).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    pending.resolve(jsonResponse(200, { vehicle: { ...i20, quantity: 5 } }))
    expect(await within(card()).findByRole('button', { name: 'Purchase' })).toBeEnabled()
  })

  it('shows the server’s message when the car sold out meanwhile (409)', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [i20] }), jsonResponse(409, { error: 'Out of stock' }))
    renderDashboard()
    await screen.findByRole('heading', { name: 'i20' })

    await userEvent.click(within(card()).getByRole('button', { name: 'Purchase' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Out of stock')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('can dismiss the confirmation', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [i20] }), jsonResponse(200, { vehicle: { ...i20, quantity: 5 } }))
    renderDashboard()
    await screen.findByRole('heading', { name: 'i20' })
    await userEvent.click(within(card()).getByRole('button', { name: 'Purchase' }))
    await screen.findByRole('status')

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
