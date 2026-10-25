import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/HttpError';

/** True if the error is Prisma's "record not found" (code P2025). */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

/**
 * Use in a catch block around a Prisma update/delete.
 * Turns Prisma's "record not found" error (code P2025) into a 404 HttpError
 * with the given message; any other error is re-thrown unchanged.
 */
export function rethrowNotFound(error: unknown, message: string): never {
  if (isRecordNotFound(error)) {
    throw new HttpError(404, message);
  }
  throw error;
}
