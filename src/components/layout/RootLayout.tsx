import { Outlet, ScrollRestoration } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { FullScreenSpinner } from '../ui/Spinner'

/** Waits for the session check before rendering any route,
 *  so guards never redirect based on a "not loaded yet" user. */
export function RootLayout() {
  const { isLoading } = useAuth()
  if (isLoading) return <FullScreenSpinner />

  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}
