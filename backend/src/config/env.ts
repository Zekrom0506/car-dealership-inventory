/**
 * The single place that reads environment variables.
 * Getters read lazily, so values are picked up after dotenv has loaded .env / .env.test.
 */
export const env = {
  get port(): number {
    return Number(process.env.PORT) || 4000;
  },
  get databaseUrl(): string | undefined {
    return process.env.DATABASE_URL;
  },
  get jwtSecret(): string {
    return process.env.JWT_SECRET!;
  },
  /** How long a login token stays valid, e.g. "1h" or "30m". */
  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN ?? '1h';
  },
};

// STUB (RED step): real check comes in GREEN.
export function assertRequiredEnv(): void {}
