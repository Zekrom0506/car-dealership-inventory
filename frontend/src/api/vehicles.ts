import { apiRequest } from './client'

export type Category = 'Sedan' | 'SUV' | 'Hatchback' | 'Truck' | 'Coupe' | 'Convertible' | 'Van'

/** A vehicle as the backend returns it. Price is whole rupees. */
export interface Vehicle {
  id: number
  make: string
  model: string
  category: Category
  price: number
  quantity: number
  /** http(s) URL or a site path like /cars/honda-city.jpg; null = no photo. */
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

/** GET /api/vehicles — every vehicle, newest first (including sold-out ones). */
export async function listVehicles(): Promise<Vehicle[]> {
  const { vehicles } = await apiRequest<{ vehicles: Vehicle[] }>('/vehicles')
  return vehicles
}
