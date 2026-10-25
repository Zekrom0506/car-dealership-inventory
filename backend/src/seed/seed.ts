import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { BCRYPT_ROUNDS } from '../services/auth.service';
import { normalizeEmail } from '../utils/normalizeEmail';
import { requiredString } from '../validation/fields';
import { SAMPLE_VEHICLES } from './sampleVehicles';

/** Values the admin seed reads (passed in explicitly so tests don't touch process.env). */
export interface AdminSeedEnv {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

/** A blank password counts as missing. Passwords are never trimmed otherwise. */
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const adminSeedSchema = z.object({
  ADMIN_EMAIL: requiredString('ADMIN_EMAIL')
    .transform(normalizeEmail)
    .pipe(z.email({ error: 'ADMIN_EMAIL must be a valid email address' })),
  ADMIN_PASSWORD: z.preprocess(
    blankToUndefined,
    requiredString('ADMIN_PASSWORD').min(8, { error: 'ADMIN_PASSWORD must be at least 8 characters' }),
  ),
});

/**
 * Creates the admin account from .env, or brings an existing account with that email
 * in line with .env: role ADMIN and password reset to ADMIN_PASSWORD (.env is the
 * single source of truth, so nobody who pre-registered that email keeps access).
 * @returns the normalised admin email.
 * @throws Error if ADMIN_EMAIL or ADMIN_PASSWORD is missing or invalid (nothing is written).
 */
export async function seedAdmin(env: AdminSeedEnv): Promise<string> {
  const result = adminSeedSchema.safeParse(env);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = result.data;

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: 'ADMIN' },
    update: { passwordHash, role: 'ADMIN' },
  });
  return email;
}

/**
 * Adds the demo inventory, but only to an empty vehicles table (so re-running never duplicates).
 * @returns how many vehicles were added (0 if the table already had vehicles).
 */
export async function seedSampleVehicles(): Promise<number> {
  if ((await prisma.vehicle.count()) > 0) {
    return 0;
  }
  const { count } = await prisma.vehicle.createMany({ data: SAMPLE_VEHICLES });
  return count;
}
