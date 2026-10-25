import type { RequestHandler } from 'express';
import { env } from '../config/env';

/**
 * CORS for the separately hosted frontend. Only origins listed in FRONTEND_ORIGIN get the
 * headers, so browsers block every other site from reading API responses.
 * The browser's preflight (OPTIONS) is answered here with 204, before any route runs.
 */
export const cors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || !env.frontendOrigins.includes(origin)) return next();

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.vary('Origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    return void res.sendStatus(204);
  }
  next();
};
