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
    <>
      <PageHeader title="Account" />

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {user.fullName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{user.fullName}</p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <dl className="mt-4 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Role</dt>
            <dd className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
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
    </>
  )
}
