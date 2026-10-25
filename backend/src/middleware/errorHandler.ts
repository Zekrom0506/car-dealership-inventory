import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/HttpError';

/** express.json() marks unparseable bodies with this error type. */
function isMalformedJsonError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: unknown }).type === 'entity.parse.failed';
}

/**
 * Central error handler — every error response is JSON `{ error }`:
 * - HttpError → its status and message
 * - malformed JSON body → 400
 * - anything else → 500 "Internal server error"; the real error is logged on the
 *   server only, so internal details and stack traces never reach the client.
 * Express 5 forwards errors thrown in async handlers here automatically.
 * Express needs all four parameters to recognise this as an error handler.
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
  // A response that has already started can't be replaced; let Express close it.
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
