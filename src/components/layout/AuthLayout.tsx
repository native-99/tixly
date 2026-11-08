import { Outlet } from 'react-router'
import { Logo } from '../Logo'

/** Simple centered layout for login and sign-up. */
export function AuthLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-10">
      <Logo />
      <main className="mt-8 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
