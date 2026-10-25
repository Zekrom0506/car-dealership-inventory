import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';

const app = createApp();
const validUser = { email: 'jane@example.com', password: 'SecurePass123' };

const register = (body: object) => request(app).post('/api/auth/register').send(body);

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('POST /api/auth/register', () => {
  it('returns 201 with the new user and no password fields', async () => {
    const response = await register(validUser);

    expect(response.status).toBe(201);
    // toEqual is strict: any extra field (like passwordHash) would fail this test.
    expect(response.body).toEqual({
      user: {
        id: expect.any(Number),
        email: validUser.email,
        role: 'USER',
        createdAt: expect.any(String),
      },
    });
  });

  it('stores a bcrypt hash of the password, never the plain password', async () => {
    await register(validUser);

    const saved = await prisma.user.findUnique({ where: { email: validUser.email } });
    expect(saved).not.toBeNull();
    expect(saved!.passwordHash).not.toBe(validUser.password);
    expect(await bcrypt.compare(validUser.password, saved!.passwordHash)).toBe(true);
  });

  it('ignores a role sent in the body, so nobody can self-register as ADMIN', async () => {
    const response = await register({ ...validUser, role: 'ADMIN' });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('USER');
    const saved = await prisma.user.findUnique({ where: { email: validUser.email } });
    expect(saved?.role).toBe('USER');
  });

  it('returns 409 when the email is already registered', async () => {
    await register(validUser);

    const response = await register(validUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: expect.any(String) });
    expect(await prisma.user.count()).toBe(1);
  });

  it('trims and lowercases the email before saving it', async () => {
    const response = await register({ email: '  Jane@Example.COM  ', password: validUser.password });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('jane@example.com');
    const saved = await prisma.user.findUnique({ where: { email: 'jane@example.com' } });
    expect(saved).not.toBeNull();
  });

  it('returns 409 when the same email is registered with different case or spaces', async () => {
    await register({ email: ' Jane@Example.com ', password: validUser.password });

    const response = await register({ email: 'jane@example.com', password: validUser.password });

    expect(response.status).toBe(409);
    expect(await prisma.user.count()).toBe(1);
  });

  it.each([
    ['email is missing', { password: validUser.password }, 'email is required'],
    [
      'email is not a valid email address',
      { email: 'not-an-email', password: validUser.password },
      'email must be a valid email address',
    ],
    ['password is missing', { email: validUser.email }, 'password is required'],
    [
      'password is shorter than 8 characters',
      { email: validUser.email, password: 'short' },
      'password must be at least 8 characters',
    ],
  ])('returns 400 when %s, with a clear message', async (_case, body, message) => {
    const response = await register(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
    expect(await prisma.user.count()).toBe(0);
  });
});
