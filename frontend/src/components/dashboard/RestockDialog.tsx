import { useId, useState, type FormEvent } from 'react'
import { Minus, Plus } from 'lucide-react'
import { ApiError } from '../../api/client'
import type { Vehicle } from '../../api/vehicles'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { StripLabel } from '../ui/StripLabel'
import { TextField } from '../ui/TextField'

const QUANTITY_MESSAGE = 'Quantity must be a whole number of 1 or more'

/** Restock dialog: quantity to add with −/+ and a preview of the new stock. `onSave` throws ApiError to show its message. */
export function RestockDialog({
  vehicle,
  onSave,
  onClose,
}: {
  vehicle: Vehicle
  onSave: (quantity: number) => Promise<void>
  onClose: () => void
}) {
  const labelId = useId()
  const titleId = useId()
  const [value, setValue] = useState('1')
  const [error, setError] = useState<string | undefined>()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const valid = /^\d+$/.test(value.trim()) && Number(value) >= 1
  const amount = valid ? Number(value) : 0

  function change(next: string) {
    setValue(next)
    setError(undefined)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!valid) return setError(QUANTITY_MESSAGE)
    setSaving(true)
    setServerError(null)
    try {
      await onSave(amount)
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const stepper = 'h-11 w-11 shrink-0 px-0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${labelId} ${titleId}`}
        className="flex w-full max-w-[400px] flex-col gap-5 border-[1.5px] border-ink bg-card p-5 shadow-dialog md:p-7"
      >
        <div className="flex flex-col items-start gap-2">
          <StripLabel>
            <span id={labelId}>Restock</span>
          </StripLabel>
          <h2 id={titleId} className="m-0 font-display text-2xl font-bold">
            {vehicle.make} {vehicle.model}
          </h2>
          <span className="text-sm text-grease">Currently {vehicle.quantity} in stock</span>
        </div>

        {serverError && <Banner tone="error">{serverError}</Banner>}

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              className={stepper}
              aria-label="Decrease"
              disabled={!valid || amount <= 1}
              onClick={() => change(String(amount - 1))}
            >
              <Minus size={18} aria-hidden="true" />
            </Button>
            <div className="flex-1">
              <TextField label="Quantity to add" emphasis="strong" inputMode="numeric" className="text-center" value={value} onChange={(e) => change(e.target.value)} error={error} />
            </div>
            <Button variant="secondary" className={stepper} aria-label="Increase" onClick={() => change(String(amount + 1))}>
              <Plus size={18} aria-hidden="true" />
            </Button>
          </div>
          <span className="text-sm">New stock after restock: {vehicle.quantity + amount}</span>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" busy={saving}>
              {saving ? 'Adding…' : 'Add stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
