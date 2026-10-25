import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
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

/**
 * Checks a token's signature and expiry and returns the user id inside it.
 * @throws if the token is malformed, wrongly signed, expired, or has no numeric `sub`.
 */
export function verifyToken(token: string): { userId: number } {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) {
    throw new Error('Token subject is not a user id');
  }
  return { userId };
}
