import { createContext } from 'react'
import type { SessionUser } from './session'

export interface AuthState {
  /** The logged-in user, or null when logged out. */
  user: SessionUser | null
  isAdmin: boolean
  login(email: string, password: string): Promise<void>
  /** Creates the account, then logs in with the same details. */
  register(email: string, password: string): Promise<void>
  logout(): void
}

/** Holds the auth state; provided by <AuthProvider>, read with useAuth(). */
export const AuthContext = createContext<AuthState | null>(null)
