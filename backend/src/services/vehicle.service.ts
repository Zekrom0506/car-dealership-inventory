import { prisma } from '../lib/prisma';
import type { Vehicle } from '../generated/prisma/client';
import type { CreateVehicleInput, SearchVehiclesInput } from '../validation/vehicle.schemas';

/** Adds a new vehicle to the inventory. */
export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  return prisma.vehicle.create({ data: input });
}

/** All vehicles (including sold-out ones), newest first; id breaks ties so the order is stable. */
export async function listVehicles(): Promise<Vehicle[]> {
  return prisma.vehicle.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
}

/**
 * Vehicles matching every given filter (AND). make/model: partial, case-insensitive;
 * category: exact; minPrice/maxPrice: inclusive. Filters left undefined are ignored by Prisma.
 */
export async function searchVehicles({ make, model, category, minPrice, maxPrice }: SearchVehiclesInput): Promise<Vehicle[]> {
  return prisma.vehicle.findMany({
    where: {
      make: make ? { contains: make, mode: 'insensitive' } : undefined,
      model: model ? { contains: model, mode: 'insensitive' } : undefined,
      category,
      price: { gte: minPrice, lte: maxPrice },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}
