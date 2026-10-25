import { prisma } from '../../src/lib/prisma';

/** Empties every table so each test starts from a clean database. */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
}

/** Closes the database connection so Jest can exit cleanly. */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
