import express, { Express } from 'express';

/**
 * Builds and configures the Express application.
 * Kept separate from server.ts so tests can use the app without opening a port.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());
  return app;
}
