import { NavLink } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/cn'
import { navItemsFor } from './navItems'

/** Floating dock: the active icon gets a filled accent tile, the rest stay flat. */
export function BottomNav() {
  const { user } = useAuth()
  const items = navItemsFor(user?.role ?? null)

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center gap-1 rounded-[26px] bg-white/70 p-1.5 shadow-float ring-1 ring-ink-900/5 backdrop-blur-2xl">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] px-1 text-[10px] font-semibold whitespace-nowrap transition-colors duration-300 min-[360px]:text-[11px]',
                  isActive ? 'text-brand-700' : 'text-ink-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid size-8 place-items-center rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-glow'
                        : 'text-ink-500',
                    )}
                  >
                    <item.icon className="size-[18px]" aria-hidden />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
