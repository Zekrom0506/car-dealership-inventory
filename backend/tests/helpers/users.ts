import bcrypt from 'bcryptjs';
import { prisma } from '../../src/lib/prisma';
import type { Role } from '../../src/generated/prisma/client';

/**
 * Inserts a user straight into the database (skipping the API),
 * so tests can set up any account, including admins.
 */
export async function createUser({
  email = 'jane@example.com',
  password = 'SecurePass123',
  role = 'USER' as Role,
} = {}) {
  const passwordHash = await bcrypt.hash(password, 4); // low cost: fast tests
  return prisma.user.create({ data: { email, passwordHash, role } });
}
