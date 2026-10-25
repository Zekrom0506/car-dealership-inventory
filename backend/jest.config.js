/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  // Coverage is measured on application code only; server.ts just starts the listener.
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
  coverageReporters: ['text', 'html'],
};
