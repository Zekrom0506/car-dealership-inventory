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
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/generated/**'],
  coverageReporters: ['text', 'html'],
};
