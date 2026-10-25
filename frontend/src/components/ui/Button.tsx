import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** "lg" = 48px tall call-to-action (login, Add vehicle, mobile Purchase). */
  size?: 'md' | 'lg'
  /** Icon shown before the text. */
  icon?: ReactNode
}

// STUB (RED step): real button comes in GREEN.
export function Button(_props: ButtonProps) {
  return null
}
