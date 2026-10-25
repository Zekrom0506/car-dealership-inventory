import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiRequest, onUnauthorized } from '../api/client'
import { AuthContext, type AuthState } from './authContext'
import { clearSession, loadSession, saveSession, type Session } from './session'

/** Holds who is logged in for the whole app. Restores the session from storage on load. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  // Any API call rejected with 401 (expired token, deleted user) logs us out.
  useEffect(() => onUnauthorized(() => setSession(null)), [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<Session>('/auth/login', { method: 'POST', body: { email, password } })
    saveSession(result)
    setSession(result)
  }, [])

  const register = useCallback(
    async (email: string, password: string) => {
      await apiRequest('/auth/register', { method: 'POST', body: { email, password } })
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      isAdmin: session?.user.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
