import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';
import { createVehicleRecord } from '../helpers/vehicles';

const app = createApp();
const QUANTITY_MESSAGE = 'quantity must be a positive whole number';

type TestUser = { id: number; role: 'USER' | 'ADMIN' };
let buyer: TestUser;

/** Sends POST /api/vehicles/:id/purchase as the buyer unless another user (or null for no token) is given. */
const purchase = (id: number | string, body?: object, as: TestUser | null = buyer) => {
  const req = request(app).post(`/api/vehicles/${id}/purchase`);
  if (as) req.set('Authorization', authHeader(as));
  return body === undefined ? req : req.send(body);
};

const stockOf = async (id: number) => (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

beforeEach(async () => {
  await resetDatabase();
  buyer = await createUser();
});
afterAll(disconnectDatabase);

describe('POST /api/vehicles/:id/purchase', () => {
  it('buys 1 by default when no body is sent, and returns 200 with the new stock', async () => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await purchase(vehicle.id);

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ id: vehicle.id, quantity: 4 });
    expect(await stockOf(vehicle.id)).toBe(4);
  });

  it('buys the requested quantity', async () => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await purchase(vehicle.id, { quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(3);
  });

  it('allows buying exactly the remaining stock (down to 0)', async () => {
    const vehicle = await createVehicleRecord({ quantity: 2 });

    const response = await purchase(vehicle.id, { quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(0);
  });

  it('lets an ADMIN purchase too', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
    const vehicle = await createVehicleRecord({ quantity: 1 });

    const response = await purchase(vehicle.id, undefined, admin);

    expect(response.status).toBe(200);
  });

  it('ignores unknown fields in the body', async () => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await purchase(vehicle.id, { quantity: 1, price: 1 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ quantity: 4, price: 20000 });
  });

  it('returns 409 and keeps the stock when asking for more than is left', async () => {
    const vehicle = await createVehicleRecord({ quantity: 2 });

    const response = await purchase(vehicle.id, { quantity: 3 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Not enough stock: only 2 left' });
    expect(await stockOf(vehicle.id)).toBe(2);
  });

  it('returns 409 "Out of stock" for a sold-out vehicle (e.g. someone else bought the last one)', async () => {
    const vehicle = await createVehicleRecord({ quantity: 0 });

    const response = await purchase(vehicle.id);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Out of stock' });
    expect(await stockOf(vehicle.id)).toBe(0);
  });

  it('never oversells when many buyers purchase the last car at the same moment', async () => {
    const vehicle = await createVehicleRecord({ quantity: 1 });

    const responses = await Promise.all(Array.from({ length: 5 }, () => purchase(vehicle.id)));

    const statuses = responses.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409, 409, 409, 409]);
    expect(await stockOf(vehicle.id)).toBe(0);
  });

  it('sells exactly the available stock when parallel buyers outnumber it', async () => {
    const vehicle = await createVehicleRecord({ quantity: 3 });

    const responses = await Promise.all(Array.from({ length: 5 }, () => purchase(vehicle.id)));

    expect(responses.filter((r) => r.status === 200)).toHaveLength(3);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(2);
    expect(await stockOf(vehicle.id)).toBe(0);
  });

  it.each([
    ['quantity is 0', { quantity: 0 }, QUANTITY_MESSAGE],
    ['quantity is negative', { quantity: -1 }, QUANTITY_MESSAGE],
    ['quantity has decimals', { quantity: 1.5 }, QUANTITY_MESSAGE],
    ['quantity is a string', { quantity: '2' }, QUANTITY_MESSAGE],
    ['quantity is above the maximum', { quantity: 2_147_483_648 }, 'quantity must be at most 2147483647'],
  ])('returns 400 when %s, and keeps the stock', async (_case, body, message) => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await purchase(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
    expect(await stockOf(vehicle.id)).toBe(5);
  });

  it.each([
    ['a word', 'abc'],
    ['"search"', 'search'],
  ])('returns 400 when the id is %s', async (_case, id) => {
    const response = await purchase(id);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'id must be a positive whole number' });
  });

  it('returns 404 when no vehicle has that id', async () => {
    const response = await purchase(12345);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Vehicle not found' });
  });

  it('returns 401 without a token, and keeps the stock', async () => {
    const vehicle = await createVehicleRecord({ quantity: 5 });

    const response = await purchase(vehicle.id, undefined, null);

    expect(response.status).toBe(401);
    expect(await stockOf(vehicle.id)).toBe(5);
  });
});
