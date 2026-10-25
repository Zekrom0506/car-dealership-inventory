import { Route, Routes } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

/** All app routes. Guards are added in step 4 (GREEN). */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<p>Dashboard placeholder</p>} />
    </Routes>
  )
}
