import { signToken } from '../../src/lib/jwt';
import type { User } from '../../src/generated/prisma/client';

/** Returns a ready-to-use Authorization header value for the given user: "Bearer <token>". */
export function authHeader(user: Pick<User, 'id' | 'role'>): string {
  return `Bearer ${signToken(user)}`;
}
