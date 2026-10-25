import type { RequestHandler } from 'express';
import type { Role } from '../generated/prisma/client';

/** The logged-in user, attached to the request by requireAuth. */
export interface AuthUser {
  id: number;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// STUB (RED step): lets every request through. Real checks come in GREEN.
export const requireAuth: RequestHandler = (_req, _res, next) => next();

// STUB (RED step): lets every request through. Real checks come in GREEN.
export const requireAdmin: RequestHandler = (_req, _res, next) => next();
