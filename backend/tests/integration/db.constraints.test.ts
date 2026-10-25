import { prisma } from '../../src/lib/prisma';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createVehicleRecord } from '../helpers/vehicles';

/**
 * Last line of defence: the database itself must refuse impossible values,
 * even if a bug lets them past the API's validation.
 * These tests write directly with Prisma, skipping the API on purpose.
 */
beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('vehicles table constraints', () => {
  it('rejects a negative quantity on insert', async () => {
    await expect(createVehicleRecord({ quantity: -1 })).rejects.toThrow();
    expect(await prisma.vehicle.count()).toBe(0);
  });

  it('rejects an update that would make quantity negative', async () => {
    const vehicle = await createVehicleRecord({ quantity: 1 });

    await expect(
      prisma.vehicle.update({ where: { id: vehicle.id }, data: { quantity: { decrement: 2 } } }),
    ).rejects.toThrow();

    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).quantity).toBe(1);
  });

  it.each([
    ['0', 0],
    ['negative', -500],
  ])('rejects a %s price', async (_case, price) => {
    await expect(createVehicleRecord({ price })).rejects.toThrow();
    expect(await prisma.vehicle.count()).toBe(0);
  });

  it('accepts the boundary values quantity 0 and price 1', async () => {
    await expect(createVehicleRecord({ quantity: 0, price: 1 })).resolves.toMatchObject({ quantity: 0, price: 1 });
  });
});
