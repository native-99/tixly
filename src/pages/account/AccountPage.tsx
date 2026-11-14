import { useMutation } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import { roleLabel } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/services'
import { paths } from '@/routes/paths'

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // Leave this protected page *before* clearing the user. Otherwise its guard
  // reacts first and redirects to /login?next=/account.
  const signOutMutation = useMutation({
    mutationFn: async () => {
      navigate(paths.events, { replace: true })
      await signOut()
    },
  })

  // The route guard guarantees a user here.
  if (!user) return null

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader eyebrow="Profile" title="Account" description="Your account and session." />

      <section className="overflow-hidden rounded-3xl bg-white/90 shadow-soft ring-1 ring-ink-900/5 backdrop-blur-xl">
        <div className="bg-linear-to-br from-brand-600 via-brand-700 to-violet-600 px-5 py-7 text-white">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-xl font-extrabold backdrop-blur">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold tracking-tight">{user.fullName}</p>
              <p className="truncate text-sm text-white/75">{user.email}</p>
            </div>
          </div>
        </div>
        <dl className="px-5 py-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-500">Role</dt>
            <dd className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-500/15 ring-inset">
              {roleLabel[user.role]}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 space-y-3">
        {signOutMutation.isError && <ErrorAlert>{getErrorMessage(signOutMutation.error)}</ErrorAlert>}
        <Button
          variant="danger"
          fullWidth
          isLoading={signOutMutation.isPending}
          onClick={() => signOutMutation.mutate()}
        >
          <LogOut className="size-4" aria-hidden />
          Log out
        </Button>
      </div>
    </div>
  )
}
