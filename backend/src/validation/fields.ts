import { z } from 'zod';

/** Largest value a PostgreSQL INTEGER column can hold. */
export const MAX_INT = 2_147_483_647;

/** A string field with a readable message when it is missing or not a string. */
export const requiredString = (field: string) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${field} is required` : `${field} must be a string`),
  });

/** Required text, trimmed, and not allowed to be empty after trimming. */
export const nonEmptyText = (field: string) =>
  requiredString(field).trim().min(1, { error: `${field} cannot be empty` });

/** Treats a blank string (empty or only spaces) as "not given"; other values pass through unchanged. */
export const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
