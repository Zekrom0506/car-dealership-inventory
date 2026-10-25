import request from 'supertest';
import { createApp } from '../../src/app';

/**
 * App-wide error responses: whatever goes wrong, the client always gets JSON in the
 * same { error } shape, never Express's default HTML pages.
 */
const app = createApp();

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
