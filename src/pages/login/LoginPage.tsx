import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { safeRedirectPath } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/services'
import { paths } from '@/routes/paths'
import { DemoAccounts } from './DemoAccounts'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const nextPath = safeRedirectPath(searchParams.get('next'))

  // After sign-in, the <GuestOnly> guard redirects to ?next= or the role's home.
  const signInMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      signIn(credentials.email, credentials.password),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    signInMutation.mutate({ email, password })
  }

  const registerLink = nextPath
    ? `${paths.register}?next=${encodeURIComponent(nextPath)}`
    : paths.register

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to buy and manage your tickets.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {signInMutation.isError && <ErrorAlert>{getErrorMessage(signInMutation.error)}</ErrorAlert>}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <Button
          type="submit"
          fullWidth
          isLoading={signInMutation.isPending}
          disabled={!email || !password}
        >
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to Tixly?{' '}
        <Link to={registerLink} className="font-semibold text-brand-600">
          Create an account
        </Link>
      </p>

      <DemoAccounts
        disabled={signInMutation.isPending}
        onPick={(demoEmail, demoPassword) => {
          setEmail(demoEmail)
          setPassword(demoPassword)
          signInMutation.mutate({ email: demoEmail, password: demoPassword })
        }}
      />
    </>
  )
}
