export type Role = 'USER' | 'ADMIN'

export interface SessionUser {
  id: number
  email: string
  role: Role
  createdAt: string
}

export interface Session {
  token: string
  user: SessionUser
}

/** localStorage key for the logged-in session. */
export const SESSION_KEY = 'yourGarage.session'

// STUB (RED step): real storage comes in GREEN.
export function loadSession(): Session | null {
  return null
}
// STUB (RED step)
export function saveSession(_session: Session): void {}
// STUB (RED step)
export function clearSession(): void {}
