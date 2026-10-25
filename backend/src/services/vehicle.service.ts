import { prisma } from '../lib/prisma';
import type { Prisma, Vehicle } from '../generated/prisma/client';
import { rethrowNotFound } from '../lib/prismaErrors';
import type { CreateVehicleInput, SearchVehiclesInput, UpdateVehicleInput } from '../validation/vehicle.schemas';

const VEHICLE_NOT_FOUND = 'Vehicle not found';

/** Shared sort for every vehicle list: newest first; id breaks ties so the order is stable. */
const NEWEST_FIRST: Prisma.VehicleOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }];

/** Adds a new vehicle to the inventory. */
export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  return prisma.vehicle.create({ data: input });
}

/** All vehicles, including sold-out ones, newest first. */
export async function listVehicles(): Promise<Vehicle[]> {
  return prisma.vehicle.findMany({ orderBy: NEWEST_FIRST });
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
    orderBy: NEWEST_FIRST,
  });
}

/**
 * Changes the given fields of a vehicle.
 * @throws HttpError 404 if no vehicle has that id.
 */
export async function updateVehicle(id: number, fields: UpdateVehicleInput): Promise<Vehicle> {
  try {
    return await prisma.vehicle.update({ where: { id }, data: fields });
  } catch (error) {
    rethrowNotFound(error, VEHICLE_NOT_FOUND);
  }
}

/**
 * Permanently removes a vehicle.
 * @throws HttpError 404 if no vehicle has that id.
 */
export async function deleteVehicle(id: number): Promise<void> {
  try {
    await prisma.vehicle.delete({ where: { id } });
  } catch (error) {
    rethrowNotFound(error, VEHICLE_NOT_FOUND);
  }
}
