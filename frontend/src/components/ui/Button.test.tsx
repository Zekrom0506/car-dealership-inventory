import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its text as a button', () => {
    render(<Button>Purchase</Button>)

    expect(screen.getByRole('button', { name: 'Purchase' })).toBeInTheDocument()
  })

  it('is type="button" by default, so it never submits a form by accident', () => {
    render(<Button>Edit</Button>)

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('type', 'button')
  })

  it('can be a submit button when asked', () => {
    render(<Button type="submit">Log in</Button>)

    expect(screen.getByRole('button', { name: 'Log in' })).toHaveAttribute('type', 'submit')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Purchase</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Purchase' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled (e.g. "Sold out")', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Sold out
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Sold out' })
    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows an icon next to the text without changing the accessible name', () => {
    render(<Button icon={<svg data-testid="cart-icon" />}>Purchase</Button>)

    expect(screen.getByRole('button', { name: 'Purchase' })).toContainElement(screen.getByTestId('cart-icon'))
  })

  it('when busy: is disabled, tells screen readers it is busy, and ignores clicks', async () => {
    const onClick = vi.fn()
    render(
      <Button busy onClick={onClick}>
        Logging in…
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Logging in…' })
    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(onClick).not.toHaveBeenCalled()
  })
})
