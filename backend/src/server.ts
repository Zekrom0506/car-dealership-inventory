import 'dotenv/config'; // must run first so DATABASE_URL etc. are set
import { createApp } from './app';
import { assertRequiredEnv, env } from './config/env';

try {
  assertRequiredEnv();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

createApp().listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
