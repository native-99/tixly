import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { safeRedirectPath } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { ErrorAlert, SuccessAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/services'
import { paths } from '@/routes/paths'
import { DemoAccounts } from './DemoAccounts'

export default function LoginPage() {
  const { signIn, sendMagicLink } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const nextPath = safeRedirectPath(searchParams.get('next'))

  // After sign-in, the <GuestOnly> guard redirects to ?next= or the role's home.
  const signInMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      signIn(credentials.email, credentials.password),
  })

  // The link lands back on /login, where <GuestOnly> hands over to the role's
  // home (or ?next=). The same allow-listed host is used for local dev.
  const magicLinkMutation = useMutation({
    mutationFn: (targetEmail: string) => {
      const target = nextPath
        ? `${paths.login}?next=${encodeURIComponent(nextPath)}`
        : paths.login
      return sendMagicLink(targetEmail, new URL(target, window.location.origin).toString())
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    signInMutation.mutate({ email, password })
  }

  function handleMagicLink() {
    magicLinkMutation.mutate(email.trim())
  }

  const registerLink = nextPath
    ? `${paths.register}?next=${encodeURIComponent(nextPath)}`
    : paths.register

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 md:text-3xl">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-500">Log in to buy and manage your tickets.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
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

      <div className="mt-6 flex items-center gap-3 text-[11px] font-bold tracking-widest text-ink-400 uppercase">
        <span className="h-px flex-1 bg-ink-200" />
        or
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <div className="mt-5 space-y-3">
        {magicLinkMutation.isError && (
          <ErrorAlert>{getErrorMessage(magicLinkMutation.error)}</ErrorAlert>
        )}
        {magicLinkMutation.isSuccess && (
          <SuccessAlert>
            A login link is on its way to <strong>{email.trim()}</strong>. Open it in this browser
            to sign in.
          </SuccessAlert>
        )}

        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={handleMagicLink}
          isLoading={magicLinkMutation.isPending}
          disabled={!email.trim()}
        >
          <Mail className="size-4" aria-hidden />
          Email me a login link
        </Button>
        <p className="text-center text-xs text-ink-500">
          No password needed. The link signs you in once.
        </p>
      </div>

      <p className="mt-7 text-center text-sm text-ink-600">
        New to Tixly?{' '}
        <Link to={registerLink} className="font-bold text-brand-700">
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
