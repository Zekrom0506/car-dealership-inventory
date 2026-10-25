import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/** Prisma CLI configuration. DATABASE_URL is read from .env unless already set. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
