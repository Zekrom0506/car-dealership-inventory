import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { CATEGORIES, type Category, type VehicleFilters } from '../../api/vehicles'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'

/** Desktop search panel: make, model, category, price range, Filter. Runs on submit (Filter or Enter). */
export function FilterForm({
  filters,
  onChange,
  onSubmit,
  busy,
}: {
  filters: VehicleFilters
  onChange: (filters: VehicleFilters) => void
  onSubmit: () => void
  busy: boolean
}) {
  const set = (key: keyof VehicleFilters) => (value: string) => onChange({ ...filters, [key]: value })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      role="search"
      aria-label="Filter vehicles"
      noValidate
      onSubmit={handleSubmit}
      className="grid grid-cols-1 items-end gap-4 border-[1.5px] border-ink bg-paper p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_auto] md:p-5"
    >
      <TextField label="Make" value={filters.make} onChange={(e) => set('make')(e.target.value)} />
      <TextField label="Model" value={filters.model} onChange={(e) => set('model')(e.target.value)} />
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        Category
        <select
          value={filters.category}
          onChange={(e) => set('category')(e.target.value as Category | '')}
          className="h-11 border border-ink bg-paper px-3 font-body text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-burnt"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <TextField label="Min price (₹)" type="number" min={0} inputMode="numeric" value={filters.minPrice} onChange={(e) => set('minPrice')(e.target.value)} />
      <TextField label="Max price (₹)" type="number" min={0} inputMode="numeric" value={filters.maxPrice} onChange={(e) => set('maxPrice')(e.target.value)} />
      <Button type="submit" busy={busy} icon={<Search size={18} aria-hidden="true" />}>
        Filter
      </Button>
    </form>
  )
}
