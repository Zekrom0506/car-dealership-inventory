import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';

/** Routes under /api/auth. */
export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
