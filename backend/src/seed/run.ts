import 'dotenv/config'; // must run first so DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD are set
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { seedAdmin, seedSampleVehicles } from './seed';

/** Entry point for `npm run db:seed`. Exits with code 1 (and writes nothing) on invalid config. */
async function main(): Promise<void> {
  const adminEmail = await seedAdmin({ ADMIN_EMAIL: env.adminEmail, ADMIN_PASSWORD: env.adminPassword });
  console.log(`Admin ready: ${adminEmail}`);

  const added = await seedSampleVehicles();
  console.log(added > 0 ? `Added ${added} sample vehicles` : 'Vehicles already exist: no sample vehicles added');
}

main()
  .catch((error: Error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
