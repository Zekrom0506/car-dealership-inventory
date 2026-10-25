/** Simple shape check (something@something.tld). The server does the real validation. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Messages shown under auth form fields (wording from the design where it exists). */
export const AUTH_MESSAGES = {
  emailRequired: 'Email is required',
  emailInvalid: 'Enter a valid email address, like name@example.com',
  passwordRequired: 'Password is required',
  passwordTooShort: 'Use at least 8 characters',
  confirmRequired: 'Please confirm your password',
  passwordsDontMatch: 'Passwords don’t match',
} as const

/** Error for the email field, or undefined if it's fine. */
export function emailError(email: string): string | undefined {
  if (!email.trim()) return AUTH_MESSAGES.emailRequired
  if (!isValidEmail(email)) return AUTH_MESSAGES.emailInvalid
  return undefined
}
