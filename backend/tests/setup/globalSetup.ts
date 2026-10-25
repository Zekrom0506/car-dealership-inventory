import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Runs once before the whole test suite: applies all migrations to the test database.
 */
export default function globalSetup(): void {
  const testEnv = dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), quiet: true }).parsed ?? {};
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, ...testEnv },
    stdio: 'ignore',
  });
}
