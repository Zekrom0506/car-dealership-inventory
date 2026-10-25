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

/** Variables the app cannot run without. */
const REQUIRED_VARIABLES = ['JWT_SECRET', 'DATABASE_URL'] as const;

/**
 * Fails fast at startup instead of failing later on the first login or query.
 * @throws Error naming the first missing (or blank) required variable.
 */
export function assertRequiredEnv(): void {
  for (const name of REQUIRED_VARIABLES) {
    if (!process.env[name]?.trim()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
}
