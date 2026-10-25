import { useId, useState } from 'react'
import { ApiError } from '../../api/client'
import type { Vehicle } from '../../api/vehicles'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'

/** "Delete {make} {model}?" confirmation. `onConfirm` throws ApiError to show its message here. */
export function DeleteDialog({
  vehicle,
  onConfirm,
  onClose,
}: {
  vehicle: Vehicle
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const titleId = useId()
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirm() {
    if (deleting) return
    setDeleting(true)
    setServerError(null)
    try {
      await onConfirm()
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-[440px] flex-col gap-5 border-[1.5px] border-t-[6px] border-ink border-t-rust bg-card p-5 shadow-dialog md:p-7"
      >
        <h2 id={titleId} className="m-0 font-display text-2xl font-bold">
          Delete {vehicle.make} {vehicle.model}?
        </h2>
        <p className="m-0 text-[15px] text-grease">This removes the vehicle from inventory permanently. This can’t be undone.</p>
        {serverError && <Banner tone="error">{serverError}</Banner>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" busy={deleting} onClick={confirm}>
            {deleting ? 'Deleting…' : 'Delete vehicle'}
          </Button>
        </div>
      </div>
    </div>
  )
}
