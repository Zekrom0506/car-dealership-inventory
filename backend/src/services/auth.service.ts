import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { HttpError } from '../errors/HttpError';
import type { User } from '../generated/prisma/client';
import type { RegisterInput } from '../validation/auth.schemas';

/** Cost factor for bcrypt: higher is slower to brute-force (and slower to compute). */
const BCRYPT_ROUNDS = 10;

/** The user fields that are safe to send to clients (never the password hash). */
export type PublicUser = Pick<User, 'id' | 'email' | 'role' | 'createdAt'>;

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}

/**
 * Creates a new account with role USER.
 * @throws HttpError 409 if the email is already registered.
 */
export async function registerUser({ email, password }: RegisterInput): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  return toPublicUser(user);
}
