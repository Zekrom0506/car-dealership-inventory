import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { requireAuth, requireAdmin } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/errorHandler';
import { signToken } from '../../src/lib/jwt';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';

/** A tiny app used only by these tests: one protected route and one admin-only route. */
const app = express();
app.get('/protected', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
app.get('/admin-only', requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true });
});
app.use(errorHandler);

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('requireAuth', () => {
  it('lets a request with a valid Bearer token through and attaches the user', async () => {
    const user = await createUser();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: { id: user.id, role: 'USER' } });
  });

  it('returns 401 when there is no Authorization header', async () => {
    const response = await request(app).get('/protected');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it.each([
    ['the token has no "Bearer " prefix', (token: string) => token],
    ['the header is "Bearer" with no token', () => 'Bearer '],
    ['a different scheme is used', () => 'Basic dXNlcjpwYXNz'],
  ])('returns 401 when %s', async (_case, buildHeader) => {
    const user = await createUser();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', buildHeader(signToken(user)));

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('returns 401 when the token is not a valid JWT', async () => {
    const response = await request(app).get('/protected').set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('returns 401 when the token was signed with a different secret', async () => {
    const user = await createUser();
    const forged = jwt.sign({ role: 'ADMIN' }, 'some-other-secret', { subject: String(user.id) });

    const response = await request(app).get('/protected').set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('returns 401 (and does not crash) when the token has expired', async () => {
    const user = await createUser();
    const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
    const expired = jwt.sign({ role: user.role, exp: oneMinuteAgo }, process.env.JWT_SECRET!, {
      subject: String(user.id),
    });

    const response = await request(app).get('/protected').set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('returns 401 when the token is valid but the user has since been deleted', async () => {
    const user = await createUser();
    const token = signToken(user);
    await prisma.user.delete({ where: { id: user.id } });

    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid or expired token' });
  });
});

describe('requireAdmin', () => {
  it('lets an ADMIN through', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });

    const response = await request(app)
      .get('/admin-only')
      .set('Authorization', authHeader(admin));

    expect(response.status).toBe(200);
  });

  it('returns 403 for a logged-in USER', async () => {
    const user = await createUser();

    const response = await request(app)
      .get('/admin-only')
      .set('Authorization', authHeader(user));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Admin access required' });
  });

  it('uses the current role from the database: a demoted admin gets 403 with their old token', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
    const tokenIssuedWhileAdmin = signToken(admin);
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'USER' } });

    const response = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokenIssuedWhileAdmin}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Admin access required' });
  });
});
