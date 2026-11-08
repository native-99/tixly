import { Link } from 'react-router'
import { roleLabel } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { paths } from '@/routes/paths'
import { Logo } from '../Logo'

export function AppHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Logo />
        {user ? (
          <Link to={paths.account} className="flex items-center gap-2" aria-label="Account">
            <span className="hidden text-right text-xs leading-tight min-[360px]:block">
              <span className="block max-w-32 truncate font-medium text-slate-800">{user.fullName}</span>
              <span className="text-slate-500">{roleLabel[user.role]}</span>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </Link>
        ) : (
          <Link to={paths.login} className="text-sm font-semibold text-brand-600">
            Log in
          </Link>
        )}
      </div>
    </header>
  )
}
