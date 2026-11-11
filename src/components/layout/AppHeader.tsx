import { Link, NavLink } from 'react-router'
import { roleLabel } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { Logo } from '../Logo'
import { navItemsFor } from './navItems'

export function AppHeader() {
  const { user } = useAuth()
  const items = navItemsFor(user?.role ?? null)

  return (
    <header className="sticky top-0 z-20 border-b border-white/50 bg-white/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-18 md:px-6">
        <Logo />

        {/* Desktop: the mobile bottom nav moves up here, so Account is not duplicated. */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/15'
                    : 'text-ink-500 hover:bg-ink-900/5 hover:text-ink-900',
                )
              }
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <Link
            to={paths.account}
            className="flex items-center gap-2.5 rounded-2xl p-1 pr-2 transition-colors hover:bg-ink-900/5 md:hidden"
            aria-label={`Account: ${user.fullName}`}
          >
            <span className="hidden text-right text-xs leading-tight min-[360px]:block">
              <span className="block max-w-32 truncate font-semibold text-ink-800">{user.fullName}</span>
              <span className="text-ink-500">{roleLabel[user.role]}</span>
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-violet-600 text-sm font-bold text-white shadow-glow">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </Link>
        ) : (
          <Link
            to={paths.login}
            className="rounded-xl bg-linear-to-br from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 md:hidden"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  )
}
