import { Outlet } from 'react-router'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'

/** Main mobile layout: sticky header, scrolling content, fixed bottom nav. */
export function AppShell() {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      {/* Bottom padding keeps content clear of the fixed bottom nav. */}
      <main className="mx-auto w-full max-w-md px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
