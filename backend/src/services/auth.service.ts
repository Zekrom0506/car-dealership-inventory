import { prisma } from '../lib/prisma';
import { HttpError } from '../errors/HttpError';
import { signToken } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import type { User } from '../generated/prisma/client';
import type { LoginInput, RegisterInput } from '../validation/auth.schemas';

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

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  return toPublicUser(user);
}

/**
 * Checks credentials and issues a JWT.
 * @throws HttpError 401 if the email is unknown or the password is wrong (same message for both).
 */
export async function loginUser({ email, password }: LoginInput): Promise<{ token: string; user: PublicUser }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return { token: signToken(user), user: toPublicUser(user) };
}
