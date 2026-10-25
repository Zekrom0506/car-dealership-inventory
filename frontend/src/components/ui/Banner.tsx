import type { ReactNode } from 'react'

export interface BannerProps {
  /** success = navy (confirmations), error = rust (server errors). */
  tone: 'success' | 'error'
  children: ReactNode
  /** When given, a ✕ Dismiss button is shown. */
  onDismiss?: () => void
}

// STUB (RED step): real banner comes in GREEN.
export function Banner(_props: BannerProps) {
  return null
}
