import { z } from 'zod';
import { Category } from '../generated/prisma/enums';
import { MAX_INT, nonEmptyText } from './fields';

const CATEGORIES = Object.values(Category);

const PRICE_MESSAGE = 'price must be a positive whole number';
const QUANTITY_MESSAGE = 'quantity must be a whole number of 0 or more';

/** One of the fixed categories, with a message listing them all. */
const categoryField = z.enum(CATEGORIES, {
  error: (issue) =>
    issue.input === undefined ? 'category is required' : `category must be one of: ${CATEGORIES.join(', ')}`,
});

/** Whole-number price from 1 up to the database integer limit. */
const priceField = z
  .number({ error: (issue) => (issue.input === undefined ? 'price is required' : PRICE_MESSAGE) })
  .int({ error: PRICE_MESSAGE })
  .positive({ error: PRICE_MESSAGE })
  .max(MAX_INT, { error: `price must be at most ${MAX_INT}` });

export const createVehicleSchema = z.object({
  make: nonEmptyText('make'),
  model: nonEmptyText('model'),
  category: categoryField,
  price: priceField,
  quantity: z
    .number({ error: (issue) => (issue.input === undefined ? 'quantity is required' : QUANTITY_MESSAGE) })
    .int({ error: QUANTITY_MESSAGE })
    .min(0, { error: QUANTITY_MESSAGE })
    .max(MAX_INT, { error: `quantity must be at most ${MAX_INT}` }),
});

export type CreateVehicleInput = z.output<typeof createVehicleSchema>;

const ID_MESSAGE = 'id must be a positive whole number';

/** The :id route parameter: digits only, starting 1–9, within the database integer limit. */
export const vehicleIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, { error: ID_MESSAGE })
  .transform(Number)
  .pipe(z.number().max(MAX_INT, { error: ID_MESSAGE }));

/**
 * PUT body: any subset of make/model/category/price.
 * quantity is rejected (stock changes only via purchase/restock); unknown fields are dropped.
 */
export const updateVehicleSchema = z
  .object({
    quantity: z.never({ error: 'quantity cannot be changed here; use purchase or restock' }).optional(),
    make: nonEmptyText('make').optional(),
    model: nonEmptyText('model').optional(),
    category: categoryField.optional(),
    price: priceField.optional(),
  })
  .transform(({ quantity: _quantity, ...fields }) => fields)
  .refine((fields) => Object.values(fields).some((value) => value !== undefined), {
    error: 'provide at least one field to update: make, model, category, price',
  });

export type UpdateVehicleInput = z.output<typeof updateVehicleSchema>;

/** Query-string values arrive as text; a blank value counts as "not given". */
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/** Optional whole-number price filter from the query string, e.g. "20000". */
const priceFilter = (field: string) => {
  const message = `${field} must be a whole number of 0 or more`;
  return z.preprocess(
    blankToUndefined,
    z
      .string({ error: message })
      .regex(/^\d+$/, { error: message })
      .transform(Number)
      .pipe(z.number().max(MAX_INT, { error: `${field} must be at most ${MAX_INT}` }))
      .optional(),
  );
};

/** GET /api/vehicles/search query. Unknown parameters are dropped. */
export const searchVehiclesSchema = z
  .object({
    make: z.preprocess(blankToUndefined, z.string().trim().optional()),
    model: z.preprocess(blankToUndefined, z.string().trim().optional()),
    category: z.preprocess(blankToUndefined, categoryField.optional()),
    minPrice: priceFilter('minPrice'),
    maxPrice: priceFilter('maxPrice'),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    error: 'minPrice cannot be greater than maxPrice',
  });

export type SearchVehiclesInput = z.output<typeof searchVehiclesSchema>;
