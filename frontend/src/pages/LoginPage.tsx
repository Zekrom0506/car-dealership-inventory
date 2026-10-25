import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../auth/useAuth'
import { useSubmitAction } from '../hooks/useSubmitAction'
import { AUTH_MESSAGES, emailError } from '../lib/validation'

type Field = 'email' | 'password'

/** /login — "Welcome back". */
export function LoginPage() {
  const { login } = useAuth()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const { busy, serverError, isSubmitting, run } = useSubmitAction('/')

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSubmitting()) return

    const found = {
      email: emailError(values.email),
      password: values.password ? undefined : AUTH_MESSAGES.passwordRequired,
    }
    setErrors(found)
    if (found.email || found.password) return

    await run(() => login(values.email.trim(), values.password))
  }

  return (
    <AuthLayout activeTab="login">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 font-display text-2xl font-bold md:text-[28px]">Welcome back</h1>
        <span className="text-sm text-grease">Log in to browse and buy from the inventory.</span>
      </div>

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
          autoComplete="current-password"
          emphasis="strong"
          inputSize="lg"
          value={values.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
        />
        <Button type="submit" size="lg" busy={busy} className="w-full">
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <span className="text-center text-sm text-grease">
        New here? <Link to="/register">Create an account</Link>
      </span>
    </AuthLayout>
  )
}
