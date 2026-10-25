import type { InputHTMLAttributes } from 'react'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Shown in rust under the input; also marks the input invalid. */
  error?: string
  /** Muted help text under the input, e.g. "Only when adding". */
  hint?: string
}

// STUB (RED step): real field comes in GREEN.
export function TextField(_props: TextFieldProps) {
  return null
}
