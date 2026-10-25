import { z } from 'zod';
import { Category } from '../generated/prisma/enums';
import { MAX_INT, nonEmptyText } from './fields';

const CATEGORIES = Object.values(Category);

const PRICE_MESSAGE = 'price must be a positive whole number';
const QUANTITY_MESSAGE = 'quantity must be a whole number of 0 or more';

export const createVehicleSchema = z.object({
  make: nonEmptyText('make'),
  model: nonEmptyText('model'),
  category: z.enum(CATEGORIES, {
    error: (issue) =>
      issue.input === undefined ? 'category is required' : `category must be one of: ${CATEGORIES.join(', ')}`,
  }),
  price: z
    .number({ error: (issue) => (issue.input === undefined ? 'price is required' : PRICE_MESSAGE) })
    .int({ error: PRICE_MESSAGE })
    .positive({ error: PRICE_MESSAGE })
    .max(MAX_INT, { error: `price must be at most ${MAX_INT}` }),
  quantity: z
    .number({ error: (issue) => (issue.input === undefined ? 'quantity is required' : QUANTITY_MESSAGE) })
    .int({ error: QUANTITY_MESSAGE })
    .min(0, { error: QUANTITY_MESSAGE })
    .max(MAX_INT, { error: `quantity must be at most ${MAX_INT}` }),
});

export type CreateVehicleInput = z.output<typeof createVehicleSchema>;
