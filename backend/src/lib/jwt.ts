import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { User } from '../generated/prisma/client';

/**
 * Creates a login token for a user.
 * Payload: `sub` = user id (as a string, per the JWT standard) and `role`.
 */
export function signToken(user: Pick<User, 'id' | 'role'>): string {
  return jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}
