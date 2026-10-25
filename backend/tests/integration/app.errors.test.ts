import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';
import { createVehicleRecord } from '../helpers/vehicles';

/**
 * App-wide error responses: whatever goes wrong, the client always gets JSON in the
 * same { error } shape, never Express's default HTML pages.
 */
const app = createApp();

afterAll(disconnectDatabase);

describe('malformed JSON body', () => {
  it.each([
    ['cut-off JSON', '{"email": "jane@example.com", "password": '],
    ['a bare string (not an object)', '"just a string"'],
  ])('returns 400 JSON { error } for %s', async (_case, rawBody) => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(response.status).toBe(400);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ error: 'Request body must be valid JSON' });
  });
});

describe('unknown routes', () => {
  it.each([
    ['an unknown path', 'get', '/api/nope'],
    ['the site root', 'get', '/'],
    ['a method no route uses (PATCH)', 'patch', '/api/vehicles/1'],
    ['an unknown path under a real route', 'post', '/api/vehicles/1/nope'],
  ] as const)('returns 404 JSON { error } for %s', async (_case, method, url) => {
    const response = await request(app)[method](url);

    expect(response.status).toBe(404);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ error: 'Not found' });
  });
});

describe('unexpected errors', () => {
  const internalDetails = 'connection to 10.0.0.5 failed, password=hunter2';

  beforeEach(resetDatabase);
  // Put back the real functions replaced with jest.spyOn in each test.
  afterEach(() => jest.restoreAllMocks());

  it('returns 500 JSON { error } without leaking details or a stack trace, and logs the real error', async () => {
    const user = await createUser();
    // Make the real database call behind GET /api/vehicles fail unexpectedly.
    jest.spyOn(prisma.vehicle, 'findMany').mockRejectedValue(new Error(internalDetails));
    // Capture server-side logging so it doesn't clutter the test output.
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).get('/api/vehicles').set('Authorization', authHeader(user));

    expect(response.status).toBe(500);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ error: 'Internal server error' });
    expect(response.text).not.toContain('hunter2');
    expect(response.text).not.toContain('10.0.0.5');
    expect(response.text).not.toMatch(/\.ts:\d+/); // no stack trace lines like "vehicle.service.ts:15"
    expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ message: internalDetails }));
  });

  it.each([
    ['PUT /:id (update)', 'update', 'put', '', { price: 1 }],
    ['DELETE /:id (delete)', 'delete', 'delete', '', undefined],
    ['POST /:id/purchase', 'update', 'post', '/purchase', { quantity: 1 }],
    ['POST /:id/restock', 'update', 'post', '/restock', { quantity: 1 }],
  ] as const)(
    'returns 500 (not 404 or 409) when %s hits a database error other than "not found"',
    async (_case, prismaMethod, httpMethod, suffix, body) => {
      const admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
      const vehicle = await createVehicleRecord();
      jest.spyOn(prisma.vehicle, prismaMethod).mockRejectedValue(new Error(internalDetails));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const req = request(app)[httpMethod](`/api/vehicles/${vehicle.id}${suffix}`).set('Authorization', authHeader(admin));
      const response = body === undefined ? await req : await req.send(body);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    },
  );
});
