import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { listVehicles, type Vehicle } from '../api/vehicles'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/dashboard/AppLayout'
import { VehicleCard } from '../components/dashboard/VehicleCard'
import { Banner } from '../components/ui/Banner'
import { StripLabel } from '../components/ui/StripLabel'

/** Grid: 1 column < 640px, 2 < 1024px, 3 < 1280px, 4 from 1280px. */
const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6'

/** / — the inventory dashboard (same page for everyone; admin extras by role). */
export function DashboardPage() {
  const { isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listVehicles()
      .then((list) => active && setVehicles(list))
      .catch((e: unknown) => active && setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'))
    return () => {
      active = false
    }
  }, [])

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
            Showing {vehicles.length} of {vehicles.length} vehicles
          </p>
        )}
      </div>

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

      {vehicles && (
        <div className={GRID}>
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
