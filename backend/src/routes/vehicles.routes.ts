import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { create, list } from '../controllers/vehicle.controller';

/** Routes under /api/vehicles. */
export const vehiclesRouter = Router();

vehiclesRouter.get('/', requireAuth, list);
vehiclesRouter.post('/', requireAuth, requireAdmin, create);
