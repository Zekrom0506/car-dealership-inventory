import type { Request, Response } from 'express';
import { parseOrThrow } from '../validation/parse';
import { createVehicleSchema, searchVehiclesSchema, updateVehicleSchema, vehicleIdSchema } from '../validation/vehicle.schemas';
import { createVehicle, listVehicles, searchVehicles, updateVehicle } from '../services/vehicle.service';

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
  const id = parseOrThrow(vehicleIdSchema, req.params.id);
  const fields = parseOrThrow(updateVehicleSchema, req.body);
  const vehicle = await updateVehicle(id, fields);
  res.status(200).json({ vehicle });
}
