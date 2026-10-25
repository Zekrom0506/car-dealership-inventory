import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/HttpError';

/**
 * Use in a catch block around a Prisma update/delete.
 * Turns Prisma's "record not found" error (code P2025) into a 404 HttpError
 * with the given message; any other error is re-thrown unchanged.
 */
export function rethrowNotFound(error: unknown, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    throw new HttpError(404, message);
  }
  throw error;
}
