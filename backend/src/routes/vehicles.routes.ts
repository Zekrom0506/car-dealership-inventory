import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { create } from '../controllers/vehicle.controller';

/** Routes under /api/vehicles. */
export const vehiclesRouter = Router();

vehiclesRouter.post('/', requireAuth, requireAdmin, create);
