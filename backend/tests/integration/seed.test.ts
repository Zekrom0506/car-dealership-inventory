import { spawn } from 'child_process';
import path from 'path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { seedAdmin, seedSampleVehicles } from '../../src/seed/seed';
import { resetDatabase, disconnectDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';
import { createVehicleRecord } from '../helpers/vehicles';

const adminEnv = { ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'Admin-Pass-123' };

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('seedAdmin', () => {
  it('creates an ADMIN with a bcrypt-hashed password', async () => {
    await seedAdmin(adminEnv);

    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    expect(admin?.role).toBe('ADMIN');
    expect(admin?.passwordHash).not.toBe(adminEnv.ADMIN_PASSWORD);
    expect(await bcrypt.compare(adminEnv.ADMIN_PASSWORD, admin!.passwordHash)).toBe(true);
  });

  it('normalises ADMIN_EMAIL like register does (trim + lowercase)', async () => {
    await seedAdmin({ ...adminEnv, ADMIN_EMAIL: '  Admin@Example.COM ' });

    expect(await prisma.user.findUnique({ where: { email: 'admin@example.com' } })).not.toBeNull();
    expect(await prisma.user.count()).toBe(1);
  });

  it('creates only one admin when run twice', async () => {
    await seedAdmin(adminEnv);
    await seedAdmin(adminEnv);

    expect(await prisma.user.count()).toBe(1);
  });

  it('promotes an existing USER with that email (any case) and resets their password to ADMIN_PASSWORD', async () => {
    await createUser({ email: 'admin@example.com', password: 'Someone-Elses-Pass', role: 'USER' });

    await seedAdmin({ ...adminEnv, ADMIN_EMAIL: 'ADMIN@example.com' });

    expect(await prisma.user.count()).toBe(1);
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } });
    expect(admin.role).toBe('ADMIN');
    expect(await bcrypt.compare(adminEnv.ADMIN_PASSWORD, admin.passwordHash)).toBe(true);
    expect(await bcrypt.compare('Someone-Elses-Pass', admin.passwordHash)).toBe(false);
  });

  it('updates an existing admin password when ADMIN_PASSWORD changes (.env is the source of truth)', async () => {
    await seedAdmin(adminEnv);

    await seedAdmin({ ...adminEnv, ADMIN_PASSWORD: 'New-Admin-Pass-456' });

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } });
    expect(await bcrypt.compare('New-Admin-Pass-456', admin.passwordHash)).toBe(true);
  });

  it('creates an admin who can log in through the API', async () => {
    await seedAdmin(adminEnv);

    const response = await request(createApp())
      .post('/api/auth/login')
      .send({ email: adminEnv.ADMIN_EMAIL, password: adminEnv.ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('ADMIN');
  });

  it.each([
    ['ADMIN_PASSWORD is missing', { ADMIN_EMAIL: 'admin@example.com' }, 'ADMIN_PASSWORD is required'],
    ['ADMIN_PASSWORD is blank', { ...adminEnv, ADMIN_PASSWORD: '   ' }, 'ADMIN_PASSWORD is required'],
    [
      'ADMIN_PASSWORD is shorter than 8 characters',
      { ...adminEnv, ADMIN_PASSWORD: 'short' },
      'ADMIN_PASSWORD must be at least 8 characters',
    ],
    ['ADMIN_EMAIL is missing', { ADMIN_PASSWORD: 'Admin-Pass-123' }, 'ADMIN_EMAIL is required'],
    [
      'ADMIN_EMAIL is not a valid email',
      { ...adminEnv, ADMIN_EMAIL: 'not-an-email' },
      'ADMIN_EMAIL must be a valid email address',
    ],
  ])('refuses to run, and creates nothing, when %s', async (_case, env, message) => {
    await expect(seedAdmin(env)).rejects.toThrow(message);
    expect(await prisma.user.count()).toBe(0);
  });
});

describe('seedSampleVehicles', () => {
  it('adds 12 vehicles to an empty table', async () => {
    const added = await seedSampleVehicles();

    expect(added).toBe(12);
    expect(await prisma.vehicle.count()).toBe(12);
  });

  it('covers every category and the requested brands', async () => {
    await seedSampleVehicles();
    const vehicles = await prisma.vehicle.findMany();

    expect(new Set(vehicles.map((v) => v.category))).toEqual(
      new Set(['Sedan', 'SUV', 'Hatchback', 'Truck', 'Coupe', 'Convertible', 'Van']),
    );
    for (const make of ['Toyota', 'Honda', 'Ford', 'BMW', 'Tesla', 'Hyundai']) {
      expect(vehicles.map((v) => v.make)).toContain(make);
    }
  });

  it('includes exactly two sold-out vehicles and one with only 1 left', async () => {
    await seedSampleVehicles();
    const vehicles = await prisma.vehicle.findMany();

    expect(vehicles.filter((v) => v.quantity === 0)).toHaveLength(2);
    expect(vehicles.filter((v) => v.quantity === 1)).toHaveLength(1);
  });

  it('gives every vehicle a photo path /cars/<make>-<model>.jpg (lowercase, spaces → -)', async () => {
    await seedSampleVehicles();
    const vehicles = await prisma.vehicle.findMany();

    for (const v of vehicles) {
      const slug = `${v.make}-${v.model}`.toLowerCase().replace(/\s+/g, '-');
      expect(v.imageUrl).toBe(`/cars/${slug}.jpg`);
    }
    expect(vehicles.map((v) => v.imageUrl)).toEqual(expect.arrayContaining(['/cars/toyota-innova-hycross.jpg', '/cars/tesla-model-3.jpg']));
  });

  it('uses a wide range of rupee prices (under ₹10 lakh up to over ₹1 crore)', async () => {
    await seedSampleVehicles();
    const prices = (await prisma.vehicle.findMany()).map((v) => v.price);

    expect(Math.min(...prices)).toBeLessThan(10_00_000);
    expect(Math.max(...prices)).toBeGreaterThan(1_00_00_000);
  });

  it('adds nothing if the table already has vehicles', async () => {
    await createVehicleRecord({ make: 'Existing', model: 'Car' });

    const added = await seedSampleVehicles();

    expect(added).toBe(0);
    expect(await prisma.vehicle.count()).toBe(1);
  });

  it('does not duplicate vehicles when run twice', async () => {
    await seedSampleVehicles();
    await seedSampleVehicles();

    expect(await prisma.vehicle.count()).toBe(12);
  });
});

describe('npm run db:seed (src/seed/run.ts)', () => {
  it('exits with code 1, explains why, and writes nothing when ADMIN_PASSWORD is too short', async () => {
    const backendDir = path.resolve(__dirname, '../..');
    const result = await new Promise<{ exitCode: number | null; output: string }>((resolve) => {
      const child = spawn(path.join(backendDir, 'node_modules', '.bin', 'tsx'), ['src/seed/run.ts'], {
        cwd: backendDir,
        env: {
          PATH: process.env.PATH ?? '',
          DOTENV_CONFIG_PATH: '/dev/null',
          DATABASE_URL: process.env.DATABASE_URL!,
          ADMIN_EMAIL: 'admin@example.com',
          ADMIN_PASSWORD: 'short',
        },
      });
      let output = '';
      child.stdout.on('data', (chunk) => (output += chunk));
      child.stderr.on('data', (chunk) => (output += chunk));
      child.on('exit', (exitCode) => resolve({ exitCode, output }));
    });

    expect(result.output).toContain('ADMIN_PASSWORD must be at least 8 characters');
    expect(result.exitCode).toBe(1);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.vehicle.count()).toBe(0);
  }, 15_000);
});
