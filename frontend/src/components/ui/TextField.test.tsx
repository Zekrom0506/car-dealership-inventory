import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('connects the label to the input', () => {
    render(<TextField label="Email" />)

    expect(screen.getByLabelText('Email')).toBeInstanceOf(HTMLInputElement)
  })

  it('passes input props through (type, value, onChange)', async () => {
    const onChange = vi.fn()
    render(<TextField label="Password" type="password" defaultValue="" onChange={onChange} />)

    const input = screen.getByLabelText('Password')
    await userEvent.type(input, 'abc')

    expect(input).toHaveAttribute('type', 'password')
    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it('is not marked invalid and shows no message when there is no error', () => {
    render(<TextField label="Email" />)

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the error, marks the input invalid, and links the message for screen readers', () => {
    render(<TextField label="Email" error="Enter a valid email address, like name@example.com" />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid email address, like name@example.com')
  })

  it('links a hint (e.g. "Only when adding") as the input description', () => {
    render(<TextField label="Quantity" hint="Only when adding" />)

    expect(screen.getByLabelText('Quantity')).toHaveAccessibleDescription('Only when adding')
  })

  it('gives each field its own id, so two fields with the same label stay separate', () => {
    render(
      <>
        <TextField label="Price" error="Price must be above ₹0" />
        <TextField label="Price" />
      </>,
    )

    const [withError, withoutError] = screen.getAllByLabelText('Price')
    expect(withError.id).not.toBe(withoutError.id)
    expect(withoutError).not.toHaveAccessibleDescription()
  })
})
