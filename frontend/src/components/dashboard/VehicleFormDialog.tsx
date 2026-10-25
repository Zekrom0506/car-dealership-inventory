import { useId, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { CATEGORIES, type Category, type NewVehicle, type Vehicle } from '../../api/vehicles'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { StripLabel } from '../ui/StripLabel'
import { TextField } from '../ui/TextField'

type Field = 'make' | 'model' | 'price' | 'quantity' | 'imageUrl'
type Values = Record<Field, string> & { category: Category }

/** Same rule as the backend (decision 23): http(s) link, or a site path starting with a single "/". */
const IMAGE_URL_PATTERN = /^(https?:\/\/[^\s/]+\S*|\/(?!\/)\S*)$/i

function validate(values: Values, mode: 'add' | 'edit'): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  if (!values.make.trim()) errors.make = 'Make is required'
  if (!values.model.trim()) errors.model = 'Model is required'

  const price = values.price.trim()
  if (!price) errors.price = 'Price is required'
  else if (!/^-?\d+$/.test(price)) errors.price = 'Price must be a whole number'
  else if (Number(price) <= 0) errors.price = 'Price must be above ₹0'

  if (mode === 'add') {
    const quantity = values.quantity.trim()
    if (!quantity) errors.quantity = 'Quantity is required'
    else if (!/^\d+$/.test(quantity)) errors.quantity = 'Quantity must be a whole number of 0 or more'
  }

  const imageUrl = values.imageUrl.trim()
  if (imageUrl && !IMAGE_URL_PATTERN.test(imageUrl)) {
    errors.imageUrl = 'Photo URL must be a link (https://…) or a path starting with /'
  }
  return errors
}

/** The form's values as the API body (trimmed; empty Photo URL → null). */
function toBody(values: Values): NewVehicle {
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    category: values.category,
    price: Number(values.price.trim()),
    quantity: Number(values.quantity.trim()),
    imageUrl: values.imageUrl.trim() || null,
  }
}

/**
 * Add / Edit vehicle dialog. "add" shows Quantity; "edit" is prefilled from `vehicle` and hides it
 * (stock changes only via purchase/restock). `onSave` gets the full body; throw an ApiError to show its message.
 */
export function VehicleFormDialog({
  mode,
  vehicle,
  onSave,
  onClose,
}: {
  mode: 'add' | 'edit'
  vehicle?: Vehicle
  onSave: (body: NewVehicle) => Promise<void>
  onClose: () => void
}) {
  const titleId = useId()
  const [values, setValues] = useState<Values>({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? 'Sedan',
    price: vehicle ? String(vehicle.price) : '',
    quantity: vehicle ? String(vehicle.quantity) : '',
    imageUrl: vehicle?.imageUrl ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const title = mode === 'add' ? 'Add vehicle' : 'Edit vehicle'

  function update(field: keyof Values, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const found = validate(values, mode)
    setErrors(found)
    if (Object.values(found).some(Boolean)) return

    setSaving(true)
    setServerError(null)
    try {
      await onSave(toBody(values))
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-[480px] flex-col gap-5 border-[1.5px] border-ink bg-card p-5 shadow-dialog md:p-7"
      >
        <div className="flex flex-col items-start gap-2">
          <StripLabel>Add / edit</StripLabel>
          <h2 id={titleId} className="m-0 font-display text-2xl font-bold">
            {title}
          </h2>
        </div>

        {serverError && <Banner tone="error">{serverError}</Banner>}

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Make" emphasis="strong" value={values.make} onChange={(e) => update('make', e.target.value)} error={errors.make} />
            <TextField label="Model" emphasis="strong" value={values.model} onChange={(e) => update('model', e.target.value)} error={errors.model} />
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Category
            <select
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              className="h-11 border border-ink bg-paper px-3 font-body text-[15px] font-normal text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-burnt"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Price (₹)"
              emphasis="strong"
              inputMode="numeric"
              value={values.price}
              onChange={(e) => update('price', e.target.value)}
              error={errors.price}
            />
            {mode === 'add' && (
              <TextField
                label="Quantity"
                emphasis="strong"
                inputMode="numeric"
                value={values.quantity}
                onChange={(e) => update('quantity', e.target.value)}
                error={errors.quantity}
                hint={errors.quantity ? undefined : 'Only when adding'}
              />
            )}
          </div>
          <TextField
            label="Photo URL (optional)"
            emphasis="strong"
            placeholder="https://… or /cars/…"
            value={values.imageUrl}
            onChange={(e) => update('imageUrl', e.target.value)}
            error={errors.imageUrl}
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" busy={saving}>
              {saving ? 'Saving…' : 'Save vehicle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
