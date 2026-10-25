import { prisma } from '../lib/prisma';
import type { Vehicle } from '../generated/prisma/client';
import type { CreateVehicleInput } from '../validation/vehicle.schemas';

/** Adds a new vehicle to the inventory. */
export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  return prisma.vehicle.create({ data: input });
}

/** All vehicles (including sold-out ones), newest first; id breaks ties so the order is stable. */
export async function listVehicles(): Promise<Vehicle[]> {
  return prisma.vehicle.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
}
