import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_KEY, type SessionUser } from '../auth/session'
import { adminUser, fakeFetch, fakeToken, jsonResponse, priya, requestAt } from '../test/fakes'
import { DashboardPage } from './DashboardPage'

const mustang = {
  id: 2, make: 'Ford', model: 'Mustang', category: 'Coupe', price: 7500000, quantity: 1, imageUrl: null,
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

const card = () => screen.getByRole('heading', { name: 'Mustang' }).closest('article') as HTMLElement
const dialog = () => screen.getByRole('dialog', { name: 'Restock Ford Mustang' })

async function openRestock() {
  await screen.findByRole('heading', { name: 'Mustang' })
  await userEvent.click(within(card()).getByRole('button', { name: 'Restock' }))
  return within(dialog())
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage — restock (admin)', () => {
  it('shows Restock on cards only to admins', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [mustang] }))
    renderDashboard(priya)
    await screen.findByRole('heading', { name: 'Mustang' })

    expect(within(card()).queryByRole('button', { name: 'Restock' })).not.toBeInTheDocument()
  })

  it('shows current stock, a −/+ quantity (starting at 1) and the new-stock preview', async () => {
    fakeFetch(jsonResponse(200, { vehicles: [mustang] }))
    renderDashboard()
    const d = await openRestock()

    expect(d.getByText('Currently 1 in stock')).toBeInTheDocument()
    const quantity = d.getByLabelText('Quantity to add')
    expect(quantity).toHaveValue('1')
    expect(d.getByText('New stock after restock: 2')).toBeInTheDocument()
    expect(d.getByRole('button', { name: 'Decrease' })).toBeDisabled()

    await userEvent.click(d.getByRole('button', { name: 'Increase' }))
    await userEvent.click(d.getByRole('button', { name: 'Increase' }))
    expect(quantity).toHaveValue('3')
    expect(d.getByText('New stock after restock: 4')).toBeInTheDocument()

    await userEvent.click(d.getByRole('button', { name: 'Decrease' }))
    expect(quantity).toHaveValue('2')

    await userEvent.clear(quantity)
    await userEvent.type(quantity, '4')
    expect(d.getByText('New stock after restock: 5')).toBeInTheDocument()
  })

  it('adds the stock, updates the card and confirms', async () => {
    const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [mustang] }), jsonResponse(200, { vehicle: { ...mustang, quantity: 5 } }))
    renderDashboard()
    const d = await openRestock()

    await userEvent.clear(d.getByLabelText('Quantity to add'))
    await userEvent.type(d.getByLabelText('Quantity to add'), '4')
    await userEvent.click(d.getByRole('button', { name: 'Add stock' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Stock updated. Ford Mustang now has 5 in stock.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(card()).getByText('5 in stock')).toBeInTheDocument()
    expect(within(card()).queryByText('Only 1 left')).not.toBeInTheDocument()
    const request = requestAt(fetchMock, 1)
    expect(request.url).toBe('/api/vehicles/2/restock')
    expect(request.method).toBe('POST')
    expect(request.body).toEqual({ quantity: 4 })
  })

  it.each([['empty', ''], ['0', '0'], ['decimals', '1.5']])(
    'shows an error and sends nothing when the quantity is %s',
    async (_case, typed) => {
      const fetchMock = fakeFetch(jsonResponse(200, { vehicles: [mustang] }))
      renderDashboard()
      const d = await openRestock()

      await userEvent.clear(d.getByLabelText('Quantity to add'))
      if (typed) await userEvent.type(d.getByLabelText('Quantity to add'), typed)
      await userEvent.click(d.getByRole('button', { name: 'Add stock' }))

      expect(d.getByLabelText('Quantity to add')).toHaveAccessibleDescription('Quantity must be a whole number of 1 or more')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    },
  )

  it('keeps the dialog open and shows the server’s 400 message', async () => {
    fakeFetch(
      jsonResponse(200, { vehicles: [mustang] }),
      jsonResponse(400, { error: 'restock would exceed the maximum stock of 2147483647' }),
    )
    renderDashboard()
    const d = await openRestock()

    await userEvent.click(d.getByRole('button', { name: 'Add stock' }))

    expect(await d.findByRole('alert')).toHaveTextContent('restock would exceed the maximum stock of 2147483647')
    expect(dialog()).toBeInTheDocument()
  })
})
