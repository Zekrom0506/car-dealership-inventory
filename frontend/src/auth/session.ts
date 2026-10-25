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

/**
 * Reads the token's `exp` (seconds) without checking the signature — only to avoid
 * reusing a token we already know is expired. The server still verifies every request.
 */
function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown }
    return typeof exp !== 'number' || exp * 1000 <= Date.now()
  } catch {
    return true // unreadable token: treat as unusable
  }
}

function isSession(value: unknown): value is Session {
  const s = value as Session
  return typeof s?.token === 'string' && typeof s.user?.email === 'string' && (s.user.role === 'USER' || s.user.role === 'ADMIN')
}

/** The stored session, or null if there is none or it is corrupt or expired (which also clears it). */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session: unknown = JSON.parse(raw)
    if (isSession(session) && !isExpired(session.token)) return session
  } catch {
    // corrupt JSON or storage unavailable: fall through and clear
  }
  clearSession()
  return null
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // storage unavailable (e.g. private mode): the session just won't survive a refresh
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // storage unavailable: nothing to clear
  }
}
