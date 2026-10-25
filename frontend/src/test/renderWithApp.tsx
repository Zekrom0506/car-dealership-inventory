import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'

/**
 * Renders the app's routes at `path` inside the real AuthProvider.
 * The dashboard is a placeholder here so tests can check where the user ends up.
 */
export function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<p>Dashboard placeholder</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

/** A promise you resolve later — used to keep a request "in progress" during a test. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}
