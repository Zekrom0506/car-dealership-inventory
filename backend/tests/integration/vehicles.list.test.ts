import request from 'supertest';
import { createApp } from '../../src/app';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';
import { createVehicleRecord } from '../helpers/vehicles';

const app = createApp();

/** Sends GET /api/vehicles as the given user. */
const listVehicles = (user: { id: number; role: 'USER' | 'ADMIN' }) =>
  request(app).get('/api/vehicles').set('Authorization', authHeader(user));

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('GET /api/vehicles', () => {
  it('returns 200 with all vehicles for a logged-in USER (not only admins)', async () => {
    const user = await createUser();
    const vehicle = await createVehicleRecord();

    const response = await listVehicles(user);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      vehicles: [
        {
          id: vehicle.id,
          make: 'Toyota',
          model: 'Corolla',
          category: 'Sedan',
          price: 20000,
          quantity: 5,
          createdAt: vehicle.createdAt.toISOString(),
          updatedAt: vehicle.updatedAt.toISOString(),
        },
      ],
    });
  });

  it('returns 200 for an ADMIN too', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
    await createVehicleRecord();

    const response = await listVehicles(admin);

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(1);
  });

  it('includes sold-out vehicles (quantity 0) so the UI can show them with Purchase disabled', async () => {
    const user = await createUser();
    await createVehicleRecord({ model: 'In stock', quantity: 3 });
    await createVehicleRecord({ model: 'Sold out', quantity: 0 });

    const response = await listVehicles(user);

    expect(response.status).toBe(200);
    const models = response.body.vehicles.map((v: { model: string }) => v.model);
    expect(models).toEqual(expect.arrayContaining(['In stock', 'Sold out']));
    expect(models).toHaveLength(2);
  });

  it('returns an empty list when there are no vehicles', async () => {
    const user = await createUser();

    const response = await listVehicles(user);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ vehicles: [] });
  });

  it('orders vehicles newest first (by createdAt), not by insertion order', async () => {
    const user = await createUser();
    // Inserted in a mixed-up order on purpose, so id order ≠ date order.
    await createVehicleRecord({ model: 'Middle', createdAt: new Date('2026-01-02T00:00:00Z') });
    await createVehicleRecord({ model: 'Oldest', createdAt: new Date('2026-01-01T00:00:00Z') });
    await createVehicleRecord({ model: 'Newest', createdAt: new Date('2026-01-03T00:00:00Z') });

    const response = await listVehicles(user);

    expect(response.status).toBe(200);
    expect(response.body.vehicles.map((v: { model: string }) => v.model)).toEqual(['Newest', 'Middle', 'Oldest']);
  });

  it('breaks ties on the same createdAt by id (higher id first), so the order is always the same', async () => {
    const user = await createUser();
    const sameTime = new Date('2026-01-01T00:00:00Z');
    const first = await createVehicleRecord({ model: 'First', createdAt: sameTime });
    const second = await createVehicleRecord({ model: 'Second', createdAt: sameTime });

    const response = await listVehicles(user);

    expect(response.status).toBe(200);
    expect(response.body.vehicles.map((v: { id: number }) => v.id)).toEqual([second.id, first.id]);
  });

  it('returns 401 without a token', async () => {
    const response = await request(app).get('/api/vehicles');

    expect(response.status).toBe(401);
  });
});
