import express, { Express } from 'express';
import { authRouter } from './routes/auth.routes';

/**
 * Builds and configures the Express application.
 * Kept separate from server.ts so tests can use the app without opening a port.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  // Lightweight liveness check used by tests, Docker and the hosting platform.
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);

  return app;
}
