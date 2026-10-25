import type { Prisma } from '../generated/prisma/client';

/**
 * Demo inventory for local development and screenshots.
 * Prices are whole Indian rupees (e.g. 7_50_000 = ₹7,50,000).
 * Covers every category; two are sold out and one has a single unit left.
 */
type SampleVehicle = Omit<Prisma.VehicleCreateManyInput, 'imageUrl'>;

/** Photo path served by the frontend: /cars/<make>-<model>.jpg, lowercase, spaces → "-". */
export const photoPath = ({ make, model }: { make: string; model: string }) =>
  `/cars/${`${make}-${model}`.toLowerCase().replace(/\s+/g, '-')}.jpg`;

const VEHICLES: SampleVehicle[] = [
  { make: 'Hyundai', model: 'i20', category: 'Hatchback', price: 7_50_000, quantity: 8 },
  { make: 'Honda', model: 'Amaze', category: 'Sedan', price: 8_00_000, quantity: 7 },
  { make: 'Honda', model: 'City', category: 'Sedan', price: 12_50_000, quantity: 5 },
  { make: 'Hyundai', model: 'Creta', category: 'SUV', price: 14_00_000, quantity: 10 },
  { make: 'Toyota', model: 'Innova Hycross', category: 'Van', price: 25_00_000, quantity: 4 },
  { make: 'Toyota', model: 'Hilux', category: 'Truck', price: 32_00_000, quantity: 3 },
  { make: 'Ford', model: 'Endeavour', category: 'SUV', price: 36_00_000, quantity: 0 },
  { make: 'Tesla', model: 'Model 3', category: 'Sedan', price: 60_00_000, quantity: 6 },
  { make: 'Tesla', model: 'Model Y', category: 'SUV', price: 70_00_000, quantity: 4 },
  { make: 'Ford', model: 'Mustang', category: 'Coupe', price: 75_00_000, quantity: 1 },
  { make: 'BMW', model: 'Z4', category: 'Convertible', price: 90_00_000, quantity: 0 },
  { make: 'BMW', model: 'X5', category: 'SUV', price: 1_20_00_000, quantity: 2 },
];

/** The sample vehicles, each with its photo path (files live in frontend/public/cars/). */
export const SAMPLE_VEHICLES: Prisma.VehicleCreateManyInput[] = VEHICLES.map((v) => ({ ...v, imageUrl: photoPath(v) }));
