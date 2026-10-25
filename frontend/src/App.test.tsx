import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

// Proves the test setup works (Vitest + jsdom + React Testing Library + jest-dom matchers).
describe('App', () => {
  it('renders the yourGarage brand', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'yourGarage' })).toBeInTheDocument()
  })
})
