import { assertRequiredEnv } from '../../src/config/env';

/** Runs `fn` with some environment variables changed, then puts them back. */
function withEnv(changes: Record<string, string | undefined>, fn: () => void): void {
  const saved = { ...process.env };
  try {
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fn();
  } finally {
    process.env = saved;
  }
}

describe('assertRequiredEnv', () => {
  it('does not throw when JWT_SECRET and DATABASE_URL are set', () => {
    withEnv({ JWT_SECRET: 'a-secret', DATABASE_URL: 'postgresql://localhost/db' }, () => {
      expect(() => assertRequiredEnv()).not.toThrow();
    });
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['only spaces', '   '],
  ])('throws when JWT_SECRET is %s', (_case, value) => {
    withEnv({ JWT_SECRET: value }, () => {
      expect(() => assertRequiredEnv()).toThrow('Missing required environment variable: JWT_SECRET');
    });
  });

  it('throws when DATABASE_URL is missing', () => {
    withEnv({ DATABASE_URL: undefined }, () => {
      expect(() => assertRequiredEnv()).toThrow('Missing required environment variable: DATABASE_URL');
    });
  });
});
