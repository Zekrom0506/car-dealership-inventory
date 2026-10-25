import type { Request, Response } from 'express';
import { parseOrThrow } from '../validation/parse';
import { registerSchema } from '../validation/auth.schemas';
import { registerUser } from '../services/auth.service';

/** POST /api/auth/register — HTTP layer only: parse input, call service, send response. */
export async function register(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(registerSchema, req.body);
  const user = await registerUser(input);
  res.status(201).json({ user });
}
