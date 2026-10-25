import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { authHeader } from '../helpers/auth';
import { createVehicleRecord } from '../helpers/vehicles';

const app = createApp();

type TestUser = { id: number; role: 'USER' | 'ADMIN' };
let admin: TestUser;

/** Sends DELETE /api/vehicles/:id, as the admin unless another user (or null for no token) is given. */
const deleteVehicle = (id: number | string, as: TestUser | null = admin) => {
  const req = request(app).delete(`/api/vehicles/${id}`);
  if (as) req.set('Authorization', authHeader(as));
  return req;
};

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
});
afterAll(disconnectDatabase);

describe('DELETE /api/vehicles/:id', () => {
  it('returns 204 with an empty body and removes only that vehicle', async () => {
    const toDelete = await createVehicleRecord({ model: 'Corolla' });
    const toKeep = await createVehicleRecord({ model: 'Camry' });

    const response = await deleteVehicle(toDelete.id);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expect(await prisma.vehicle.findUnique({ where: { id: toDelete.id } })).toBeNull();
    expect(await prisma.vehicle.findUnique({ where: { id: toKeep.id } })).not.toBeNull();
  });

  it('returns 404 when the same vehicle is deleted a second time', async () => {
    const vehicle = await createVehicleRecord();
    await deleteVehicle(vehicle.id);

    const response = await deleteVehicle(vehicle.id);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Vehicle not found' });
  });

  it('returns 404 when no vehicle has that id', async () => {
    const response = await deleteVehicle(12345);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Vehicle not found' });
  });

  it.each([
    ['a word', 'abc'],
    ['"search"', 'search'],
    ['zero', '0'],
  ])('returns 400 when the id is %s', async (_case, id) => {
    const response = await deleteVehicle(id);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'id must be a positive whole number' });
  });

  it('returns 401 without a token, and deletes nothing', async () => {
    const vehicle = await createVehicleRecord();

    const response = await deleteVehicle(vehicle.id, null);

    expect(response.status).toBe(401);
    expect(await prisma.vehicle.count()).toBe(1);
  });

  it('returns 403 for a logged-in USER, and deletes nothing', async () => {
    const user = await createUser();
    const vehicle = await createVehicleRecord();

    const response = await deleteVehicle(vehicle.id, user);

    expect(response.status).toBe(403);
    expect(await prisma.vehicle.count()).toBe(1);
  });
});
