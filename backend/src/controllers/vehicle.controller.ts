import type { Request, Response } from 'express';
import { parseOrThrow } from '../validation/parse';
import { createVehicleSchema, searchVehiclesSchema } from '../validation/vehicle.schemas';
import { createVehicle, listVehicles, searchVehicles } from '../services/vehicle.service';

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
