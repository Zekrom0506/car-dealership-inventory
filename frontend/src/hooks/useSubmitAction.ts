import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Runs a form's server action once at a time: sets `busy`, puts any error
 * into `serverError` (for the banner), and navigates to `to` on success.
 */
export function useSubmitAction(to: string) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  // A ref (not state) so a second submit in the same instant is still blocked.
  const submitting = useRef(false)

  /** True while an action is running — check it before validating. */
  function isSubmitting() {
    return submitting.current
  }

  async function run(action: () => Promise<unknown>) {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setServerError(null)
    try {
      await action()
      navigate(to, { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : FALLBACK_MESSAGE)
      submitting.current = false
      setBusy(false)
    }
  }

  return { busy, serverError, isSubmitting, run }
}
