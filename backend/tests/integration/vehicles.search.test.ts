import request from 'supertest';
import { createApp } from '../../src/app';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';
import { createVehicleRecord } from '../helpers/vehicles';

const app = createApp();
const CATEGORY_MESSAGE = 'category must be one of: Sedan, SUV, Hatchback, Truck, Coupe, Convertible, Van';

let user: { id: number; role: 'USER' | 'ADMIN' };

/** Sends GET /api/vehicles/search?<query> as a normal USER. */
const search = (query: string) =>
  request(app).get(`/api/vehicles/search?${query}`).set('Authorization', authHeader(user));

/** Just the model names from a response, to keep assertions short. */
const models = (response: request.Response) => response.body.vehicles.map((v: { model: string }) => v.model);

/**
 * Same inventory for every test. Dates are set so "newest first" order is:
 * F-150, Civic, RAV4, Corolla.
 */
beforeEach(async () => {
  await resetDatabase();
  user = await createUser();
  await createVehicleRecord({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5, createdAt: new Date('2026-01-01') });
  await createVehicleRecord({ make: 'Toyota', model: 'RAV4', category: 'SUV', price: 30000, quantity: 0, createdAt: new Date('2026-01-02') });
  await createVehicleRecord({ make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000, quantity: 3, createdAt: new Date('2026-01-03') });
  await createVehicleRecord({ make: 'Ford', model: 'F-150', category: 'Truck', price: 40000, quantity: 2, createdAt: new Date('2026-01-04') });
});
afterAll(disconnectDatabase);

describe('GET /api/vehicles/search', () => {
  it('returns every vehicle, newest first, when no filters are given', async () => {
    const response = await search('');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['F-150', 'Civic', 'RAV4', 'Corolla']);
  });

  it('matches make partially and case-insensitively, including sold-out vehicles', async () => {
    const response = await search('make=toy');

    expect(response.status).toBe(200);
    // RAV4 has quantity 0 and must still appear.
    expect(models(response)).toEqual(['RAV4', 'Corolla']);
  });

  it('matches model partially and case-insensitively', async () => {
    const response = await search('model=CIV');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['Civic']);
  });

  it('matches category exactly', async () => {
    const response = await search('category=Sedan');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['Civic', 'Corolla']);
  });

  it('treats minPrice as inclusive', async () => {
    const response = await search('minPrice=22000');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['F-150', 'Civic', 'RAV4']);
  });

  it('treats maxPrice as inclusive', async () => {
    const response = await search('maxPrice=22000');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['Civic', 'Corolla']);
  });

  it('filters by a price range', async () => {
    const response = await search('minPrice=21000&maxPrice=35000');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['Civic', 'RAV4']);
  });

  it('combines filters with AND', async () => {
    const response = await search('make=toyota&category=SUV');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['RAV4']);
  });

  it('returns 200 with an empty list when nothing matches', async () => {
    const response = await search('make=toyota&category=Truck');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ vehicles: [] });
  });

  it('trims spaces around search terms', async () => {
    const response = await search('make=%20%20honda%20');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['Civic']);
  });

  it('ignores empty filters (e.g. a blank search box)', async () => {
    const response = await search('make=&model=%20&category=&minPrice=&maxPrice=');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['F-150', 'Civic', 'RAV4', 'Corolla']);
  });

  it('ignores unknown query parameters instead of failing', async () => {
    const response = await search('colour=red&make=ford');

    expect(response.status).toBe(200);
    expect(models(response)).toEqual(['F-150']);
  });

  it.each([
    ['category is not in the fixed list', 'category=Spaceship', CATEGORY_MESSAGE],
    ['minPrice is not a number', 'minPrice=abc', 'minPrice must be a whole number of 0 or more'],
    ['minPrice has decimals', 'minPrice=10.5', 'minPrice must be a whole number of 0 or more'],
    ['maxPrice is negative', 'maxPrice=-5', 'maxPrice must be a whole number of 0 or more'],
    ['maxPrice is above the maximum', 'maxPrice=2147483648', 'maxPrice must be at most 2147483647'],
    ['minPrice is greater than maxPrice', 'minPrice=30000&maxPrice=20000', 'minPrice cannot be greater than maxPrice'],
  ])('returns 400 when %s', async (_case, query, message) => {
    const response = await search(query);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
  });

  it('returns 401 without a token', async () => {
    const response = await request(app).get('/api/vehicles/search?make=toyota');

    expect(response.status).toBe(401);
  });
});
