import type { RequestHandler } from 'express';
import type { Role } from '../generated/prisma/client';
import { HttpError } from '../errors/HttpError';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

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

/** Matches "Bearer <token>" and captures the token. */
const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * Loads the user from the database, so deleted users are rejected and the
 * role is always current (not the role at login time).
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const match = req.headers.authorization?.match(BEARER_PATTERN);
  if (!match) {
    throw new HttpError(401, 'Authentication required');
  }

  let userId: number;
  try {
    ({ userId } = verifyToken(match[1]));
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user) {
    throw new HttpError(401, 'Invalid or expired token');
  }

  req.user = user;
  next();
};

/** Allows only ADMIN users. Must run after requireAuth. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required');
  }
  next();
};
