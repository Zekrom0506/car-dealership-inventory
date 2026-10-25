/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  // Applies migrations to the test database once, before all tests.
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  // Loads .env.test before each test file.
  setupFiles: ['<rootDir>/tests/setup/loadTestEnv.ts'],
  // Coverage is measured on our own application code only.
  // Excluded: the generated Prisma client, and the two entry points (server.ts, seed/run.ts).
  // The entry points are tested by starting them as real separate processes
  // (server.startup.test.ts, seed.test.ts), which Jest's coverage cannot measure.
  collectCoverageFrom: ['src/**/*.ts', '!src/generated/**', '!src/server.ts', '!src/seed/run.ts'],
  coverageReporters: ['text', 'html'],
};
