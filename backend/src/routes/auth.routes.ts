import { Router } from 'express';
import { register } from '../controllers/auth.controller';

/** Routes under /api/auth. */
export const authRouter = Router();

authRouter.post('/register', register);
