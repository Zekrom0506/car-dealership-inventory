import { z } from 'zod';
import { HttpError } from '../errors/HttpError';

/**
 * Validates `data` against a zod schema.
 * Returns the parsed (and transformed) value, or throws a 400 HttpError
 * with the first validation problem as the message.
 */
export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0].message);
  }
  return result.data;
}
