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
