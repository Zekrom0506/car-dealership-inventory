import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { create, list, purchase, remove, restock, search, update } from '../controllers/vehicle.controller';

/** Routes under /api/vehicles. */
export const vehiclesRouter = Router();

vehiclesRouter.get('/', requireAuth, list);
// Keep /search above any '/:id' route, so "search" is never read as a vehicle id.
vehiclesRouter.get('/search', requireAuth, search);
vehiclesRouter.post('/', requireAuth, requireAdmin, create);
vehiclesRouter.put('/:id', requireAuth, requireAdmin, update);
vehiclesRouter.delete('/:id', requireAuth, requireAdmin, remove);
vehiclesRouter.post('/:id/purchase', requireAuth, purchase);
vehiclesRouter.post('/:id/restock', requireAuth, requireAdmin, restock);
