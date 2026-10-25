import { prisma } from '../lib/prisma';
import type { Prisma, Vehicle } from '../generated/prisma/client';
import { isRecordNotFound, rethrowNotFound } from '../lib/prismaErrors';
import { HttpError } from '../errors/HttpError';
import { MAX_INT } from '../validation/fields';
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

/**
 * Buys `quantity` units of a vehicle.
 * The stock check and the decrease happen in ONE database statement
 * ("decrease only if at least `quantity` are in stock"), so parallel buyers can never oversell.
 * @throws HttpError 404 if the vehicle does not exist, 409 if there is not enough stock.
 */
export async function purchaseVehicle(id: number, quantity: number): Promise<Vehicle> {
  try {
    return await prisma.vehicle.update({
      where: { id, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
  } catch (error) {
    if (!isRecordNotFound(error)) throw error;
  }

  // Nothing was updated: either the vehicle doesn't exist or there isn't enough stock.
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new HttpError(404, VEHICLE_NOT_FOUND);
  }
  throw new HttpError(
    409,
    vehicle.quantity === 0 ? 'Out of stock' : `Not enough stock: only ${vehicle.quantity} left`,
  );
}

/**
 * Adds `quantity` units to a vehicle's stock (admin only).
 * The limit check and the increase happen in ONE database statement, so parallel
 * restocks and purchases never lose units.
 * @throws HttpError 404 if the vehicle does not exist, 400 if the stock would exceed MAX_INT.
 */
export async function restockVehicle(id: number, quantity: number): Promise<Vehicle> {
  try {
    return await prisma.vehicle.update({
      where: { id, quantity: { lte: MAX_INT - quantity } },
      data: { quantity: { increment: quantity } },
    });
  } catch (error) {
    if (!isRecordNotFound(error)) throw error;
  }

  // Nothing was updated: either the vehicle doesn't exist or the stock would overflow.
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new HttpError(404, VEHICLE_NOT_FOUND);
  }
  throw new HttpError(400, `restock would exceed the maximum stock of ${MAX_INT}`);
}
