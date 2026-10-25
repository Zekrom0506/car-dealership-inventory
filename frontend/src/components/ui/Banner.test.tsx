import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Banner } from './Banner'

describe('Banner', () => {
  it('announces a success message politely (role="status")', () => {
    render(<Banner tone="success">Purchase confirmed.</Banner>)

    expect(screen.getByRole('status')).toHaveTextContent('Purchase confirmed.')
  })

  it('announces an error message immediately (role="alert")', () => {
    render(<Banner tone="error">Out of stock</Banner>)

    expect(screen.getByRole('alert')).toHaveTextContent('Out of stock')
  })

  it('shows a Dismiss button that calls onDismiss', async () => {
    const onDismiss = vi.fn()
    render(
      <Banner tone="success" onDismiss={onDismiss}>
        Purchase confirmed.
      </Banner>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('has no Dismiss button when onDismiss is not given', () => {
    render(<Banner tone="success">Purchase confirmed.</Banner>)

    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
  })
})
