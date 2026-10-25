import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';
import { createVehicleRecord } from '../helpers/vehicles';

const app = createApp();
const MAX_INT = 2_147_483_647;
const QUANTITY_MESSAGE = 'quantity must be a positive whole number';

type TestUser = { id: number; role: 'USER' | 'ADMIN' };
let admin: TestUser;

/** Sends POST /api/vehicles/:id/restock as the admin unless another user (or null for no token) is given. */
const restock = (id: number | string, body?: object, as: TestUser | null = admin) => {
  const req = request(app).post(`/api/vehicles/${id}/restock`);
  if (as) req.set('Authorization', authHeader(as));
  return body === undefined ? req : req.send(body);
};

const stockOf = async (id: number) => (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
});
afterAll(disconnectDatabase);

describe('POST /api/vehicles/:id/restock', () => {
  it('adds the quantity to the stock and returns 200 with the updated vehicle', async () => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await restock(vehicle.id, { quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ id: vehicle.id, quantity: 8 });
    expect(await stockOf(vehicle.id)).toBe(8);
  });

  it('brings a sold-out vehicle back into stock', async () => {
    const vehicle = await createVehicleRecord({ quantity: 0 });

    const response = await restock(vehicle.id, { quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(2);
  });

  it('loses no units when several restocks happen at the same moment', async () => {
    const vehicle = await createVehicleRecord({ quantity: 0 });

    const responses = await Promise.all(Array.from({ length: 5 }, () => restock(vehicle.id, { quantity: 1 })));

    expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect(await stockOf(vehicle.id)).toBe(5);
  });

  it('allows restocking up to exactly the maximum stock', async () => {
    const vehicle = await createVehicleRecord({ quantity: MAX_INT - 1 });

    const response = await restock(vehicle.id, { quantity: 1 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(MAX_INT);
  });

  it('returns 400 and keeps the stock when the restock would exceed the maximum stock', async () => {
    const vehicle = await createVehicleRecord({ quantity: MAX_INT - 1 });

    const response = await restock(vehicle.id, { quantity: 2 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'restock would exceed the maximum stock of 2147483647' });
    expect(await stockOf(vehicle.id)).toBe(MAX_INT - 1);
  });

  it.each([
    ['no body is sent', undefined, 'quantity is required'],
    ['quantity is missing', {}, 'quantity is required'],
    ['quantity is 0', { quantity: 0 }, QUANTITY_MESSAGE],
    ['quantity is negative', { quantity: -2 }, QUANTITY_MESSAGE],
    ['quantity has decimals', { quantity: 1.5 }, QUANTITY_MESSAGE],
    ['quantity is a string', { quantity: '3' }, QUANTITY_MESSAGE],
    ['quantity is above the maximum', { quantity: MAX_INT + 1 }, 'quantity must be at most 2147483647'],
  ])('returns 400 when %s, and keeps the stock', async (_case, body, message) => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await restock(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
    expect(await stockOf(vehicle.id)).toBe(5);
  });

  it.each([
    ['a word', 'abc'],
    ['"search"', 'search'],
  ])('returns 400 when the id is %s', async (_case, id) => {
    const response = await restock(id, { quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'id must be a positive whole number' });
  });

  it('returns 404 when no vehicle has that id', async () => {
    const response = await restock(12345, { quantity: 1 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Vehicle not found' });
  });

  it('returns 401 without a token, and keeps the stock', async () => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await restock(vehicle.id, { quantity: 1 }, null);

    expect(response.status).toBe(401);
    expect(await stockOf(vehicle.id)).toBe(5);
  });

  it('returns 403 for a logged-in USER, and keeps the stock', async () => {
    const user = await createUser();
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await restock(vehicle.id, { quantity: 1 }, user);

    expect(response.status).toBe(403);
    expect(await stockOf(vehicle.id)).toBe(5);
  });
});
