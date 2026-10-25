import { useContext } from 'react'
import { AuthContext, type AuthState } from './authContext'

/** The current user and the login / register / logout actions. Must be used inside <AuthProvider>. */
export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
