import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/HttpError';

/** express.json() marks unparseable bodies with this error type. */
function isMalformedJsonError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: unknown }).type === 'entity.parse.failed';
}

/**
 * Central error handler: turns an HttpError into `{ error: message }` with its status,
 * and a malformed JSON body into 400.
 * Any other error is passed on to Express's default handler.
 * Express 5 forwards errors thrown in async handlers here automatically.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (isMalformedJsonError(err)) {
    res.status(400).json({ error: 'Request body must be valid JSON' });
    return;
  }
  next(err);
}
