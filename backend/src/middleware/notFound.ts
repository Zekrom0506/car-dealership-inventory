import type { Request, Response } from 'express';

/** Catch-all for requests no route matched: always 404 JSON, never Express's HTML page. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}
