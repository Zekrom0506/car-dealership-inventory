import { prisma } from '../../src/lib/prisma';
import type { Prisma } from '../../src/generated/prisma/client';

/**
 * Inserts a vehicle straight into the database (skipping the API).
 * Any field can be overridden, including createdAt, to control ordering in tests.
 */
export function createVehicleRecord(overrides: Partial<Prisma.VehicleCreateInput> = {}) {
  return prisma.vehicle.create({
    data: { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5, ...overrides },
  });
}
