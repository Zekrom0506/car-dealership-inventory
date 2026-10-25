import { z } from 'zod';
import { normalizeEmail } from '../utils/normalizeEmail';
import { requiredString } from './fields';

/** Email is normalised (trimmed + lowercased) before it is checked. */
const emailField = requiredString('email')
  .transform(normalizeEmail)
  .pipe(z.email({ error: 'email must be a valid email address' }));

export const registerSchema = z.object({
  email: emailField,
  password: requiredString('password').min(8, { error: 'password must be at least 8 characters' }),
});

export type RegisterInput = z.output<typeof registerSchema>;

/** Login only checks the password is present; length rules apply at registration. */
export const loginSchema = z.object({
  email: emailField,
  password: requiredString('password'),
});

export type LoginInput = z.output<typeof loginSchema>;
