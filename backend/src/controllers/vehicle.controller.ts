import type { Request, Response } from 'express';
import { parseOrThrow } from '../validation/parse';
import {
  createVehicleSchema,
  purchaseSchema,
  restockSchema,
  searchVehiclesSchema,
  updateVehicleSchema,
  vehicleIdSchema,
} from '../validation/vehicle.schemas';
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
} from '../services/vehicle.service';

/** Reads and validates the :id route parameter (400 if it is not a valid id). */
const vehicleIdFrom = (req: Request): number => parseOrThrow(vehicleIdSchema, req.params.id);

/** POST /api/vehicles — admin only. Returns 201 with { vehicle }. */
export async function create(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(createVehicleSchema, req.body);
  const vehicle = await createVehicle(input);
  res.status(201).json({ vehicle });
}

/** GET /api/vehicles — any logged-in user. Returns 200 with { vehicles }. */
export async function list(_req: Request, res: Response): Promise<void> {
  const vehicles = await listVehicles();
  res.status(200).json({ vehicles });
}

/** GET /api/vehicles/search — any logged-in user. Returns 200 with { vehicles }. */
export async function search(req: Request, res: Response): Promise<void> {
  const filters = parseOrThrow(searchVehiclesSchema, req.query);
  const vehicles = await searchVehicles(filters);
  res.status(200).json({ vehicles });
}

/** PUT /api/vehicles/:id — admin only. Partial update; returns 200 with { vehicle }. */
export async function update(req: Request, res: Response): Promise<void> {
  const id = vehicleIdFrom(req);
  const fields = parseOrThrow(updateVehicleSchema, req.body);
  const vehicle = await updateVehicle(id, fields);
  res.status(200).json({ vehicle });
}

/** DELETE /api/vehicles/:id — admin only. Returns 204 with no body. */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = vehicleIdFrom(req);
  await deleteVehicle(id);
  res.status(204).end();
}

/** POST /api/vehicles/:id/purchase — any logged-in user. Returns 200 with the updated { vehicle }. */
export async function purchase(req: Request, res: Response): Promise<void> {
  const id = vehicleIdFrom(req);
  // No body at all means "buy 1".
  const { quantity } = parseOrThrow(purchaseSchema, req.body ?? {});
  const vehicle = await purchaseVehicle(id, quantity);
  res.status(200).json({ vehicle });
}

/** POST /api/vehicles/:id/restock — admin only. Returns 200 with the updated { vehicle }. */
export async function restock(req: Request, res: Response): Promise<void> {
  const id = vehicleIdFrom(req);
  const { quantity } = parseOrThrow(restockSchema, req.body ?? {});
  const vehicle = await restockVehicle(id, quantity);
  res.status(200).json({ vehicle });
}
