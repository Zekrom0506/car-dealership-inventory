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

/** POST /api/vehicles/:id/purchase — buys one unit; returns the vehicle with its new stock. */
export async function purchaseVehicle(id: number): Promise<Vehicle> {
  const { vehicle } = await apiRequest<{ vehicle: Vehicle }>(`/vehicles/${id}/purchase`, { method: 'POST' })
  return vehicle
}

/** Body for POST /api/vehicles. */
export interface NewVehicle {
  make: string
  model: string
  category: Category
  price: number
  quantity: number
  imageUrl: string | null
}

/** POST /api/vehicles (admin) — returns the created vehicle. */
export async function createVehicle(body: NewVehicle): Promise<Vehicle> {
  const { vehicle } = await apiRequest<{ vehicle: Vehicle }>('/vehicles', { method: 'POST', body })
  return vehicle
}

/** PUT body: any of the editable fields (quantity is never sent; imageUrl null removes the photo). */
export type VehicleChanges = Partial<Omit<NewVehicle, 'quantity'>>

/** PUT /api/vehicles/:id (admin) — returns the updated vehicle. */
export async function updateVehicle(id: number, changes: VehicleChanges): Promise<Vehicle> {
  const { vehicle } = await apiRequest<{ vehicle: Vehicle }>(`/vehicles/${id}`, { method: 'PUT', body: changes })
  return vehicle
}
