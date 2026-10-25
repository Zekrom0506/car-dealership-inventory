import request from 'supertest';
import { createApp } from '../../src/app';

const FRONTEND = 'https://your-garage.vercel.app';
const app = createApp();

afterEach(() => {
  delete process.env.FRONTEND_ORIGIN;
});

describe('CORS (FRONTEND_ORIGIN)', () => {
  it('lets the allowed origin read the response', async () => {
    process.env.FRONTEND_ORIGIN = FRONTEND;

    const response = await request(app).get('/api/health').set('Origin', FRONTEND);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(FRONTEND);
    expect(response.headers.vary).toMatch(/Origin/i);
  });

  it('adds no CORS header for a different origin', async () => {
    process.env.FRONTEND_ORIGIN = FRONTEND;

    const response = await request(app).get('/api/health').set('Origin', 'https://evil.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('adds no CORS header when FRONTEND_ORIGIN is not set', async () => {
    const response = await request(app).get('/api/health').set('Origin', FRONTEND);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('ignores a trailing slash and allows each origin in a comma-separated list', async () => {
    process.env.FRONTEND_ORIGIN = ` ${FRONTEND}/ , http://localhost:5173 `;

    const first = await request(app).get('/api/health').set('Origin', FRONTEND);
    const second = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');

    expect(first.headers['access-control-allow-origin']).toBe(FRONTEND);
    expect(second.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('answers the browser preflight (OPTIONS) for the allowed origin with 204 and the allowed headers', async () => {
    process.env.FRONTEND_ORIGIN = FRONTEND;

    const response = await request(app)
      .options('/api/vehicles')
      .set('Origin', FRONTEND)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(FRONTEND);
    expect(response.headers['access-control-allow-headers']).toMatch(/authorization/i);
    expect(response.headers['access-control-allow-headers']).toMatch(/content-type/i);
    expect(response.headers['access-control-allow-methods']).toMatch(/PUT/);
    expect(response.headers['access-control-allow-methods']).toMatch(/DELETE/);
  });
});
