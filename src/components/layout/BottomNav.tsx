import { NavLink } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/cn'
import { navItemsFor } from './navItems'

export function BottomNav() {
  const { user } = useAuth()
  const items = navItemsFor(user?.role ?? null)

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800',
                )
              }
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
