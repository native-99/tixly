import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { safeRedirectPath } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage, type SignUpInput } from '@/services'
import { paths } from '@/routes/paths'

type FieldErrors = Partial<Record<keyof SignUpInput, string>>

function validate(input: SignUpInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.fullName.trim()) errors.fullName = 'Please enter your name.'
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) errors.email = 'Please enter a valid email.'
  if (input.password.length < 8) errors.password = 'Use at least 8 characters.'
  return errors
}

export default function RegisterPage() {
  const { signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<SignUpInput>({ fullName: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const nextPath = safeRedirectPath(searchParams.get('next'))

  // After sign-up, the <GuestOnly> guard redirects to ?next= or the role's home.
  const signUpMutation = useMutation({ mutationFn: signUp })

  function updateField(field: keyof SignUpInput, value: string) {
    setForm({ ...form, [field]: value })
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: undefined })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    signUpMutation.mutate(form)
  }

  const loginLink = nextPath ? `${paths.login}?next=${encodeURIComponent(nextPath)}` : paths.login

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 md:text-3xl">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Buy tickets in seconds and keep them on your phone.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
        {signUpMutation.isError && <ErrorAlert>{getErrorMessage(signUpMutation.error)}</ErrorAlert>}

        <TextField
          label="Full name"
          autoComplete="name"
          value={form.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          error={fieldErrors.fullName}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          error={fieldErrors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          error={fieldErrors.password}
          hint="At least 8 characters."
        />

        <Button type="submit" fullWidth isLoading={signUpMutation.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-600">
        Already have an account?{' '}
        <Link to={loginLink} className="font-bold text-brand-700">
          Log in
        </Link>
      </p>
    </>
  )
}
