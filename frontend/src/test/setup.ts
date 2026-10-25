// Adds DOM matchers like toBeInTheDocument() and toBeDisabled() to Vitest's expect.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount rendered components after every test so tests can't affect each other.
afterEach(() => {
  cleanup()
})
