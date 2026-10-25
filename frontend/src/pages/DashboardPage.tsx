import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { listVehicles, NO_FILTERS, searchVehicles, type Vehicle, type VehicleFilters } from '../api/vehicles'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/dashboard/AppLayout'
import { FilterForm } from '../components/dashboard/FilterForm'
import { VehicleCard } from '../components/dashboard/VehicleCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { StripLabel } from '../components/ui/StripLabel'
import { formatInr } from '../lib/formatInr'

/** Grid: 1 column < 640px, 2 < 1024px, 3 < 1280px, 4 from 1280px. */
const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6'

/** / — the inventory dashboard (same page for everyone; admin extras by role). */
export function DashboardPage() {
  const { isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<VehicleFilters>(NO_FILTERS)
  /** The filters of the search being shown (null = the full list). */
  const [applied, setApplied] = useState<VehicleFilters | null>(null)
  const [searching, setSearching] = useState(false)

  const messageFrom = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')

  function loadAll() {
    return listVehicles().then((list) => {
      setVehicles(list)
      setTotal(list.length)
      setApplied(null)
    })
  }

  useEffect(() => {
    let active = true
    listVehicles()
      .then((list) => {
        if (!active) return
        setVehicles(list)
        setTotal(list.length)
      })
      .catch((e: unknown) => active && setError(messageFrom(e)))
    return () => {
      active = false
    }
  }, [])

  async function runSearch() {
    setSearching(true)
    setError(null)
    try {
      setVehicles(await searchVehicles(filters))
      setApplied(filters)
    } catch (e) {
      setError(messageFrom(e))
    } finally {
      setSearching(false)
    }
  }

  async function clearFilters() {
    setFilters(NO_FILTERS)
    setError(null)
    try {
      await loadAll()
    } catch (e) {
      setError(messageFrom(e))
    }
  }

  const loading = vehicles === null && error === null

  return (
    <AppLayout>
      <div className="flex flex-col gap-2">
        <div>
          <StripLabel>{isAdmin ? 'Manage inventory' : 'Inventory'}</StripLabel>
        </div>
        <h1 className="m-0 font-display text-[30px] font-bold tracking-[-1px] md:text-[40px]">Vehicles in stock</h1>
        {vehicles && (
          <p className="m-0 text-[15px] text-grease">
            Showing {vehicles.length} of {total} vehicles
          </p>
        )}
      </div>

      <FilterForm filters={filters} onChange={setFilters} onSubmit={runSearch} busy={searching} />

      {error && <Banner tone="error">{error}</Banner>}

      {loading && (
        <div role="status" aria-label="Loading vehicles" className="flex flex-col gap-4">
          <div>
            <StripLabel>Loading</StripLabel>
          </div>
          <div className={GRID}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col border-[1.5px] border-hairline bg-card">
                <div className="aspect-video animate-pulse bg-photo" />
                <div className="flex flex-col gap-3 p-4">
                  <div className="h-3 w-1/3 animate-pulse bg-photo" />
                  <div className="h-5 w-2/3 animate-pulse bg-photo" />
                  <div className="h-11 w-full animate-pulse bg-photo" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vehicles?.length === 0 && applied && (
        <div className="flex flex-col items-center gap-3 border-[1.5px] border-dashed border-grease bg-card px-6 py-12 text-center">
          <StripLabel>No results</StripLabel>
          <h2 className="m-0 font-display text-2xl font-bold">No cars match your search</h2>
          <p className="m-0 max-w-[520px] text-[15px] text-grease">
            Nothing found for {describe(applied)}. Try widening the price range or clearing a filter.
          </p>
          <Button variant="secondary" onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      )}

      {vehicles?.length === 0 && !applied && (
        <div className="flex flex-col items-center gap-2 border-[1.5px] border-dashed border-grease bg-card px-6 py-12 text-center">
          <h2 className="m-0 font-display text-2xl font-bold">No vehicles in stock yet</h2>
          {isAdmin && <p className="m-0 text-[15px] text-grease">Add the first vehicle to get started.</p>}
        </div>
      )}

      {vehicles && vehicles.length > 0 && (
        <div className={GRID}>
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}

/** e.g. "“Tesla” · SUV · under ₹20,00,000" — the filters of a search, for the no-results message. */
function describe({ make, model, category, minPrice, maxPrice }: VehicleFilters): string {
  const min = minPrice.trim() ? formatInr(Number(minPrice)) : ''
  const max = maxPrice.trim() ? formatInr(Number(maxPrice)) : ''
  const price = min && max ? `${min} – ${max}` : min ? `over ${min}` : max ? `under ${max}` : ''
  const parts = [make.trim() && `“${make.trim()}”`, model.trim() && `“${model.trim()}”`, category, price]
  return parts.filter(Boolean).join(' · ') || 'your search'
}
