import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_KEY } from '../auth/session'
import { fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { DashboardPage } from './DashboardPage'

const v = (id: number, make: string, model: string, category: string, price: number) => ({
  id, make, model, category, price, quantity: 3, imageUrl: null,
  createdAt: '2026-10-25T00:00:00.000Z', updatedAt: '2026-10-25T00:00:00.000Z',
})
const city = v(1, 'Honda', 'City', 'Sedan', 1250000)
const creta = v(2, 'Hyundai', 'Creta', 'SUV', 1400000)
const x5 = v(3, 'BMW', 'X5', 'SUV', 12000000)
const all = { vehicles: [city, creta, x5] }

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

const form = () => screen.getByRole('search', { name: 'Filter vehicles' })

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage — search and filter', () => {
  it('shows the filter form with every category', async () => {
    fakeFetch(jsonResponse(200, all))
    renderDashboard()
    await screen.findByText('Showing 3 of 3 vehicles')

    const f = within(form())
    expect(f.getByLabelText('Make')).toBeInTheDocument()
    expect(f.getByLabelText('Model')).toBeInTheDocument()
    expect(f.getByLabelText('Min price (₹)')).toBeInTheDocument()
    expect(f.getByLabelText('Max price (₹)')).toBeInTheDocument()
    const options = within(f.getByLabelText('Category')).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['All categories', 'Sedan', 'SUV', 'Hatchback', 'Truck', 'Coupe', 'Convertible', 'Van'])
    expect(f.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
  })

  it('searches with only the filled-in filters (on Filter or Enter) and shows "Showing X of Y"', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, all), jsonResponse(200, { vehicles: [x5] }))
    renderDashboard()
    await screen.findByText('Showing 3 of 3 vehicles')

    const f = within(form())
    await userEvent.selectOptions(f.getByLabelText('Category'), 'SUV')
    await userEvent.type(f.getByLabelText('Min price (₹)'), '5000000')
    await userEvent.type(f.getByLabelText('Make'), ' BMW {enter}')

    expect(await screen.findByText('Showing 1 of 3 vehicles')).toBeInTheDocument()
    expect(requestAt(fetchMock, 1).url).toBe('/api/vehicles/search?make=BMW&category=SUV&minPrice=5000000')
    expect(screen.getByRole('heading', { name: 'X5' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'City' })).not.toBeInTheDocument()
  })

  it('shows the empty state when nothing matches, and Clear all filters brings everything back', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, all), jsonResponse(200, { vehicles: [] }), jsonResponse(200, all))
    renderDashboard()
    await screen.findByText('Showing 3 of 3 vehicles')

    const f = within(form())
    await userEvent.type(f.getByLabelText('Make'), 'Tesla')
    await userEvent.selectOptions(f.getByLabelText('Category'), 'SUV')
    await userEvent.type(f.getByLabelText('Max price (₹)'), '2000000')
    await userEvent.click(f.getByRole('button', { name: 'Filter' }))

    expect(await screen.findByRole('heading', { name: 'No cars match your search' })).toBeInTheDocument()
    expect(
      screen.getByText('Nothing found for “Tesla” · SUV · under ₹20,00,000. Try widening the price range or clearing a filter.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No vehicles in stock yet' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))

    expect(await screen.findByText('Showing 3 of 3 vehicles')).toBeInTheDocument()
    expect(requestAt(fetchMock, 2).url).toBe('/api/vehicles')
    expect(f.getByLabelText('Make')).toHaveValue('')
    expect(f.getByLabelText('Category')).toHaveValue('')
    expect(f.getByLabelText('Max price (₹)')).toHaveValue(null)
  })

  it('shows the server’s message when a search is rejected', async () => {
    fakeFetch(jsonResponse(200, all), jsonResponse(400, { error: 'minPrice cannot be greater than maxPrice' }))
    renderDashboard()
    await screen.findByText('Showing 3 of 3 vehicles')

    const f = within(form())
    await userEvent.type(f.getByLabelText('Min price (₹)'), '900')
    await userEvent.type(f.getByLabelText('Max price (₹)'), '100')
    await userEvent.click(f.getByRole('button', { name: 'Filter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('minPrice cannot be greater than maxPrice')
  })
})
