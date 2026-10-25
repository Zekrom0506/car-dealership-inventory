import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';
import { createVehicleRecord } from '../helpers/vehicles';

const app = createApp();
const CATEGORY_MESSAGE = 'category must be one of: Sedan, SUV, Hatchback, Truck, Coupe, Convertible, Van';
const PRICE_MESSAGE = 'price must be a positive whole number';
const ID_MESSAGE = 'id must be a positive whole number';
const IMAGE_URL_MESSAGE = 'imageUrl must be an http(s) URL or a path starting with /';

type TestUser = { id: number; role: 'USER' | 'ADMIN' };
let admin: TestUser;

/** Sends PUT /api/vehicles/:id, as the admin unless another user (or null for no token) is given. */
const updateVehicle = (id: number | string, body: object, as: TestUser | null = admin) => {
  const req = request(app).put(`/api/vehicles/${id}`);
  if (as) req.set('Authorization', authHeader(as));
  return req.send(body);
};

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
});
afterAll(disconnectDatabase);

describe('PUT /api/vehicles/:id', () => {
  it('changes only the fields that are sent and returns 200 with the updated vehicle', async () => {
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, { price: 18000 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({
      id: vehicle.id,
      make: 'Toyota',
      model: 'Corolla',
      category: 'Sedan',
      price: 18000,
      quantity: 5,
    });
    const saved = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(saved?.price).toBe(18000);
  });

  it('sets imageUrl (trimmed) and keeps the other fields', async () => {
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, { imageUrl: ' https://images.pexels.com/photos/1/car.jpg ' });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({
      imageUrl: 'https://images.pexels.com/photos/1/car.jpg',
      make: 'Toyota',
      price: 20000,
    });
  });

  it('removes the image when imageUrl is null', async () => {
    const vehicle = await createVehicleRecord({ imageUrl: '/cars/honda-city.jpg' });

    const response = await updateVehicle(vehicle.id, { imageUrl: null });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.imageUrl).toBeNull();
    const saved = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(saved?.imageUrl).toBeNull();
  });

  it('keeps the image when imageUrl is not sent', async () => {
    const vehicle = await createVehicleRecord({ imageUrl: '/cars/honda-city.jpg' });

    const response = await updateVehicle(vehicle.id, { price: 18000 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.imageUrl).toBe('/cars/honda-city.jpg');
  });

  it('can change make, model and category together, trimming make and model', async () => {
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, { make: ' Honda ', model: '  Civic', category: 'Hatchback' });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ make: 'Honda', model: 'Civic', category: 'Hatchback', price: 20000 });
  });

  it('updates updatedAt but keeps createdAt', async () => {
    const longAgo = new Date('2026-01-01T00:00:00Z');
    const vehicle = await createVehicleRecord({ createdAt: longAgo, updatedAt: longAgo });

    const response = await updateVehicle(vehicle.id, { price: 18000 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.createdAt).toBe(longAgo.toISOString());
    expect(new Date(response.body.vehicle.updatedAt).getTime()).toBeGreaterThan(longAgo.getTime());
  });

  it('ignores id and unknown fields in the body', async () => {
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, { id: 999, colour: 'red', price: 18000 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.id).toBe(vehicle.id);
    expect(response.body.vehicle).not.toHaveProperty('colour');
  });

  it('returns 400 when quantity is sent, because stock only changes via purchase and restock', async () => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await updateVehicle(vehicle.id, { price: 18000, quantity: 50 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'quantity cannot be changed here; use purchase or restock' });
    const saved = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(saved).toMatchObject({ quantity: 5, price: 20000 });
  });

  it.each([
    ['the body is empty', {}],
    ['the body has only unknown fields', { colour: 'red' }],
  ])('returns 400 when %s', async (_case, body) => {
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'provide at least one field to update: make, model, category, price, imageUrl' });
  });

  it.each([
    ['make is only spaces', { make: '   ' }, 'make cannot be empty'],
    ['model is only spaces', { model: '   ' }, 'model cannot be empty'],
    ['make is not a string', { make: 123 }, 'make must be a string'],
    ['category is not in the fixed list', { category: 'Spaceship' }, CATEGORY_MESSAGE],
    ['price is 0', { price: 0 }, PRICE_MESSAGE],
    ['price has decimals', { price: 99.5 }, PRICE_MESSAGE],
    ['price is a string', { price: '18000' }, PRICE_MESSAGE],
    ['price is above the maximum', { price: 2_147_483_648 }, 'price must be at most 2147483647'],
    ['imageUrl is not a URL', { imageUrl: 'not a url' }, IMAGE_URL_MESSAGE],
    ['imageUrl uses javascript:', { imageUrl: 'javascript:alert(1)' }, IMAGE_URL_MESSAGE],
    ['imageUrl is longer than 2048 characters', { imageUrl: '/' + 'a'.repeat(2048) }, 'imageUrl must be at most 2048 characters'],
  ])('returns 400 when %s, and changes nothing', async (_case, body, message) => {
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
    const saved = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(saved).toMatchObject({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000 });
  });

  it.each([
    ['a word', 'abc'],
    ['"search" (must never be treated as an id)', 'search'],
    ['a decimal', '1.5'],
    ['zero', '0'],
    ['negative', '-1'],
    ['above the database integer limit', '2147483648'],
  ])('returns 400 when the id is %s', async (_case, id) => {
    const response = await updateVehicle(id, { price: 18000 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: ID_MESSAGE });
  });

  it('returns 404 when no vehicle has that id', async () => {
    const response = await updateVehicle(12345, { price: 18000 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Vehicle not found' });
  });

  it('returns 401 without a token', async () => {
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, { price: 18000 }, null);

    expect(response.status).toBe(401);
  });

  it('returns 403 for a logged-in USER, and changes nothing', async () => {
    const user = await createUser();
    const vehicle = await createVehicleRecord();

    const response = await updateVehicle(vehicle.id, { price: 1 }, user);

    expect(response.status).toBe(403);
    const saved = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(saved?.price).toBe(20000);
  });
});
