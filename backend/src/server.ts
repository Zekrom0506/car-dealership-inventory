import 'dotenv/config'; // must run first so DATABASE_URL etc. are set
import { createApp } from './app';
import { env } from './config/env';

createApp().listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
