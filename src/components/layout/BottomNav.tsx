import { NavLink } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/cn'
import { navItemsFor } from './navItems'

export function BottomNav() {
  const { user } = useAuth()
  const items = navItemsFor(user?.role ?? null)

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 md:hidden">
      <ul className="mx-auto flex max-w-md items-center gap-1 rounded-3xl border border-white/60 bg-white/80 p-1.5 shadow-pill backdrop-blur-xl">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold whitespace-nowrap transition-all duration-200 min-[360px]:text-[11px]',
                  isActive
                    ? 'bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-glow'
                    : 'text-ink-500 hover:bg-ink-900/5 hover:text-ink-900',
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
