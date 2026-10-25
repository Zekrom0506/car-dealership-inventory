import type { Request, Response } from 'express';
import { parseOrThrow } from '../validation/parse';
import { createVehicleSchema } from '../validation/vehicle.schemas';
import { createVehicle } from '../services/vehicle.service';

/** POST /api/vehicles — admin only. Returns 201 with { vehicle }. */
export async function create(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(createVehicleSchema, req.body);
  const vehicle = await createVehicle(input);
  res.status(201).json({ vehicle });
}
