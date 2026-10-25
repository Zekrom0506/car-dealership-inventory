import { prisma } from '../lib/prisma';
import type { Vehicle } from '../generated/prisma/client';
import type { CreateVehicleInput } from '../validation/vehicle.schemas';

/** Adds a new vehicle to the inventory. */
export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  return prisma.vehicle.create({ data: input });
}
