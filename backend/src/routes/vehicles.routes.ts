import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { create, list, search } from '../controllers/vehicle.controller';

/** Routes under /api/vehicles. */
export const vehiclesRouter = Router();

vehiclesRouter.get('/', requireAuth, list);
// Keep /search above any '/:id' route, so "search" is never read as a vehicle id.
vehiclesRouter.get('/search', requireAuth, search);
vehiclesRouter.post('/', requireAuth, requireAdmin, create);
