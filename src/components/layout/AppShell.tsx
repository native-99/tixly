import { Outlet, useLocation } from 'react-router'
import { cn } from '@/lib/cn'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'

/** Main layout: sticky header, scrolling content, floating bottom nav on mobile. */
export function AppShell() {
  const { pathname } = useLocation()
  // The event detail page has its own checkout bar, so the bottom nav would
  // eat too much of a small screen.
  const isEventDetail = /^\/events\/[^/]+$/.test(pathname)

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main
        className={cn(
          'mx-auto w-full max-w-6xl px-4 pt-6 md:px-6 md:pt-10 md:pb-14',
          isEventDetail ? 'pb-8' : 'pb-28',
        )}
      >
        {/* A short rise on every route change keeps pages from feeling static. */}
        <div key={pathname} className="animate-rise">
          <Outlet />
        </div>
      </main>
      {!isEventDetail && <BottomNav />}
    </div>
  )
}
