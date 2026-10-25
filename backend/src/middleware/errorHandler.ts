import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/HttpError';

/**
 * Central error handler: turns an HttpError into `{ error: message }` with its status.
 * Any other error is passed on to Express's default handler (unchanged behaviour).
 * Express 5 forwards errors thrown in async handlers here automatically.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}
