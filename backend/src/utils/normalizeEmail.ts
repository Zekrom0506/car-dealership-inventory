/**
 * Canonical form of an email address: surrounding spaces removed, all lowercase.
 * Used by both register and login so " Jane@X.com " and "jane@x.com" are the same account.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
