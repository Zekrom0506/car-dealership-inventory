import { PackagePlus, Pencil, ShoppingCart } from 'lucide-react'
import type { Vehicle } from '../../api/vehicles'
import { formatInr } from '../../lib/formatInr'
import { Button } from '../ui/Button'
import { StripLabel } from '../ui/StripLabel'
import { VehiclePhoto } from './VehiclePhoto'

/** One vehicle: photo, labels, make/model, price, stock and the Purchase button. */
export function VehicleCard({
  vehicle,
  onPurchase,
  purchasing = false,
  onEdit,
  onRestock,
}: {
  vehicle: Vehicle
  onPurchase?: () => void
  /** This card's purchase is in progress. */
  purchasing?: boolean
  /** Admin only: shows the admin row with Edit. */
  onEdit?: () => void
  onRestock?: () => void
}) {
  const { make, model, category, price, quantity, imageUrl } = vehicle
  const soldOut = quantity === 0

  return (
    <article className="flex flex-col border-[1.5px] border-ink bg-card transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-offset-sm md:hover:shadow-offset">
      <div className="relative">
        <VehiclePhoto src={imageUrl} alt={`${make} ${model}`} />
        <StripLabel className="absolute top-3 left-3">{category}</StripLabel>
        {soldOut && (
          <StripLabel tone="soldOut" className="absolute top-3 right-3">
            Sold out
          </StripLabel>
        )}
        {quantity === 1 && (
          <StripLabel tone="low" className="absolute top-3 right-3">
            Only 1 left
          </StripLabel>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 md:px-[18px] md:pt-[18px] md:pb-5">
        <div>
          <span className="text-[13px] font-medium text-grease">{make}</span>
          <h2 className="m-0 font-display text-[22px] leading-tight font-bold">{model}</h2>
        </div>
        <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-hairline pt-3">
          <span className="font-display text-2xl font-bold">{formatInr(price)}</span>
          <span className="text-[13px] text-grease">{soldOut ? 'Out of stock' : `${quantity} in stock`}</span>
        </div>
        {soldOut ? (
          <Button disabled className="w-full">
            Sold out
          </Button>
        ) : (
          <Button className="w-full" busy={purchasing} onClick={onPurchase} icon={<ShoppingCart size={18} aria-hidden="true" />}>
            {purchasing ? 'Purchasing…' : 'Purchase'}
          </Button>
        )}
        {onEdit && (
          <div className="grid grid-cols-[1fr_1fr_44px] gap-2 border-t border-dashed border-hairline pt-3">
            <Button variant="secondary" className="px-2" icon={<Pencil size={18} aria-hidden="true" />} onClick={onEdit}>
              Edit
            </Button>
            <Button variant="secondary" className="px-2" icon={<PackagePlus size={18} aria-hidden="true" />} onClick={onRestock}>
              Restock
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
