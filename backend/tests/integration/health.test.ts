import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /api/health', () => {
  it('responds 200 with status "ok" so we know the API is running', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
