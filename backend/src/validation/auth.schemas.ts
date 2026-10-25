import { z } from 'zod';
import { normalizeEmail } from '../utils/normalizeEmail';

/** A string field with a readable message when it is missing or not a string. */
const requiredString = (field: string) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${field} is required` : `${field} must be a string`),
  });

/** Email is normalised (trimmed + lowercased) before it is checked. */
const emailField = requiredString('email')
  .transform(normalizeEmail)
  .pipe(z.email({ error: 'email must be a valid email address' }));

export const registerSchema = z.object({
  email: emailField,
  password: requiredString('password').min(8, { error: 'password must be at least 8 characters' }),
});

export type RegisterInput = z.output<typeof registerSchema>;
