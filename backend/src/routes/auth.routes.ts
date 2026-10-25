import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { normalizeEmail } from '../utils/normalizeEmail';

const registerSchema = z.object({
  email: z.string().transform(normalizeEmail).pipe(z.email()),
  password: z.string().min(8),
});

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email is already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  res.status(201).json({
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
  });
});
