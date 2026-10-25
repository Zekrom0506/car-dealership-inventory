import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../auth/useAuth'
import { AUTH_MESSAGES, emailError } from '../lib/validation'

type Field = 'email' | 'password' | 'confirm'

/** Matches the backend rule (decision 12). */
const MIN_PASSWORD_LENGTH = 8

/** /register — "Create your account". Creates the account, then logs in. */
export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // A ref (not state) so a second submit in the same instant is still blocked.
  const submitting = useRef(false)

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): Partial<Record<Field, string>> {
    const { email, password, confirm } = values
    return {
      email: emailError(email),
      password: !password
        ? AUTH_MESSAGES.passwordRequired
        : password.length < MIN_PASSWORD_LENGTH
          ? AUTH_MESSAGES.passwordTooShort
          : undefined,
      confirm: !confirm
        ? AUTH_MESSAGES.confirmRequired
        : confirm !== password
          ? AUTH_MESSAGES.passwordsDontMatch
          : undefined,
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current) return

    const found = validate()
    setErrors(found)
    if (found.email || found.password || found.confirm) return

    submitting.current = true
    setBusy(true)
    setServerError(null)
    try {
      await register(values.email.trim(), values.password)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <AuthLayout activeTab="register">
      <h1 className="m-0 font-display text-2xl font-bold md:text-[28px]">Create your account</h1>

      {serverError && <Banner tone="error">{serverError}</Banner>}

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-[18px]">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          emphasis="strong"
          inputSize="lg"
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          emphasis="strong"
          inputSize="lg"
          value={values.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          emphasis="strong"
          inputSize="lg"
          value={values.confirm}
          onChange={(e) => update('confirm', e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" size="lg" busy={busy} className="w-full">
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <span className="text-center text-sm text-grease">
        Already registered? <Link to="/login">Log in</Link>
      </span>
    </AuthLayout>
  )
}
