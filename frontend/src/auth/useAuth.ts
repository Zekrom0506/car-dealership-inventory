import type { AuthState } from './authContext'

// STUB (RED step): real hook comes in GREEN.
export function useAuth(): AuthState {
  return {
    user: null,
    isAdmin: false,
    login: async () => {},
    register: async () => {},
    logout: () => {},
  }
}
