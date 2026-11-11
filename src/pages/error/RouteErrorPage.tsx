import { isRouteErrorResponse, useRouteError } from 'react-router'
import { getErrorMessage } from '@/services'

/** Shown when a page crashes, instead of a blank screen. */
export default function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? error.statusText : getErrorMessage(error)

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-ink-500">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"
      >
        Reload
      </button>
    </div>
  )
}
