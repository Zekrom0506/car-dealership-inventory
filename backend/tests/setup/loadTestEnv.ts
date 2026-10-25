import path from 'path';
import dotenv from 'dotenv';

/**
 * Runs before every test file: loads .env.test so tests only ever use the test database.
 */
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true, quiet: true });

// Safety net: refuse to run if we're not pointed at a test database (tests delete data).
if (!process.env.DATABASE_URL?.includes('_test')) {
  throw new Error('DATABASE_URL must point at a *_test database when running tests.');
}
