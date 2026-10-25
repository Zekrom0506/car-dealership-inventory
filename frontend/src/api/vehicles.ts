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

export const CATEGORIES: Category[] = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Coupe', 'Convertible', 'Van']

/** Search filters as typed in the form; blank = not used. */
export interface VehicleFilters {
  make: string
  model: string
  category: Category | ''
  minPrice: string
  maxPrice: string
}

export const NO_FILTERS: VehicleFilters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' }

/** GET /api/vehicles/search with only the filled-in filters (trimmed). */
export async function searchVehicles(filters: VehicleFilters): Promise<Vehicle[]> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) params.set(key, value.trim())
  }
  const query = params.toString()
  const { vehicles } = await apiRequest<{ vehicles: Vehicle[] }>(`/vehicles/search${query ? `?${query}` : ''}`)
  return vehicles
}
