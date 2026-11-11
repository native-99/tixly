import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

interface OfflineBannerProps {
  /** Shown only when the list on screen came from the offline cache. */
  usingCache: boolean
  /** Extra reassurance for the cached case, e.g. "your QR codes still work". */
  cachedHint: string
}

/**
 * Explains stale data. Tickets are the important case: the QR codes still work
 * at the gate even when the phone has no signal.
 */
export function OfflineBanner({ usingCache, cachedHint }: OfflineBannerProps) {
  const online = useOnlineStatus()
  if (online && !usingCache) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm font-medium text-amber-900 backdrop-blur-sm"
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {usingCache
          ? `You're offline. Showing your saved copy — ${cachedHint}.`
          : "You're offline. New data will load when the connection is back."}
      </span>
    </div>
  )
}
