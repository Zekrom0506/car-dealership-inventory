import type { Request, Response } from 'express';
import { parseOrThrow } from '../validation/parse';
import { loginSchema, registerSchema } from '../validation/auth.schemas';
import { loginUser, registerUser } from '../services/auth.service';

/** POST /api/auth/register — HTTP layer only: parse input, call service, send response. */
export async function register(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(registerSchema, req.body);
  const user = await registerUser(input);
  res.status(201).json({ user });
}

/** POST /api/auth/login — returns 200 with { token, user }. */
export async function login(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(loginSchema, req.body);
  const result = await loginUser(input);
  res.status(200).json(result);
}
