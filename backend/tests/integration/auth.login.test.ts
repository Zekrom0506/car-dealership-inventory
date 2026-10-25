import request from 'supertest';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { createApp } from '../../src/app';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';

const app = createApp();
const credentials = { email: 'jane@example.com', password: 'SecurePass123' };

const login = (body: object) => request(app).post('/api/auth/login').send(body);

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('POST /api/auth/login', () => {
  it('returns 200 with a token and the user (no password fields)', async () => {
    const user = await createUser(credentials);

    const response = await login(credentials);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: expect.any(String),
      user: {
        id: user.id,
        email: credentials.email,
        role: 'USER',
        createdAt: user.createdAt.toISOString(),
      },
    });
  });

  it('issues a JWT signed with JWT_SECRET containing the user id and role, valid for 1 hour', async () => {
    const user = await createUser({ ...credentials, role: 'ADMIN' });

    const response = await login(credentials);

    // jwt.verify throws if the signature does not match JWT_SECRET.
    const payload = jwt.verify(response.body.token, process.env.JWT_SECRET!) as JwtPayload;
    expect(payload.sub).toBe(String(user.id));
    expect(payload.role).toBe('ADMIN');
    expect(payload.exp! - payload.iat!).toBe(60 * 60);
  });

  it('accepts the email with different case and surrounding spaces', async () => {
    await createUser(credentials);

    const response = await login({ email: '  JANE@Example.com ', password: credentials.password });

    expect(response.status).toBe(200);
  });

  it('returns 401 when the password is wrong', async () => {
    await createUser(credentials);

    const response = await login({ ...credentials, password: 'WrongPass123' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid email or password' });
  });

  it('returns 401 with the same message when the email is not registered', async () => {
    // Same message as a wrong password, so attackers can't discover which emails exist.
    const response = await login({ email: 'nobody@example.com', password: 'SecurePass123' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid email or password' });
  });

  it.each([
    ['email is missing', { password: credentials.password }, 'email is required'],
    ['password is missing', { email: credentials.email }, 'password is required'],
  ])('returns 400 when %s', async (_case, body, message) => {
    const response = await login(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
  });
});
