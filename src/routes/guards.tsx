import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { homePathFor, safeRedirectPath } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import type { Role } from '@/types'
import { paths } from './paths'

interface RequireAuthProps {
  /** Allowed roles. Omit to allow any signed-in user. */
  roles?: Role[]
}

/**
 * Route guard. Not signed in → login (and come back here afterwards).
 * Signed in with the wrong role → that role's home page.
 *
 * This only protects the UI. Real protection lives in the data layer
 * (mock services today, Row Level Security in Supabase later).
 */
export function RequireAuth({ roles }: RequireAuthProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    const next = location.pathname + location.search
    return <Navigate to={`${paths.login}?next=${encodeURIComponent(next)}`} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  return <Outlet />
}

/**
 * For login/register: signed-in users are sent on. This also runs right after
 * a successful login, so it honours ?next= the same way the login page does.
 */
export function GuestOnly() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  if (user) {
    const next = safeRedirectPath(searchParams.get('next'))
    return <Navigate to={next ?? homePathFor(user.role)} replace />
  }
  return <Outlet />
}
