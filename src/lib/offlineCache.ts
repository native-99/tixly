// Offline copies of the buyer's tickets and orders.
//
// The service worker keeps the app shell available offline. These caches keep
// the data behind it useful too: My Tickets and Orders fall back to the last
// successful response when the network is down, so the QR code at the gate does
// not depend on a signal.
//
// Only the signed-in buyer's own data is stored, and AuthProvider wipes it when
// the account changes.

const PREFIX = 'tixly.offline.v1.'
const VERSION = 1

export type OfflineKey = 'tickets' | 'orders' | 'profile'

interface Envelope<T> {
  version: number
  savedAt: string
  data: T
}

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    // Private mode or a blocked storage partition: offline data is optional.
    return null
  }
}

export function readOfflineCache<T>(key: OfflineKey): T | null {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(PREFIX + key)
    if (!raw) return null
    const envelope = JSON.parse(raw) as Envelope<T>
    if (envelope.version !== VERSION) return null
    return envelope.data
  } catch {
    // Corrupt or half-written value: ignore it and let the network refill it.
    return null
  }
}

export function writeOfflineCache<T>(key: OfflineKey, data: T): void {
  const store = storage()
  if (!store) return

  try {
    const envelope: Envelope<T> = {
      version: VERSION,
      savedAt: new Date().toISOString(),
      data,
    }
    store.setItem(PREFIX + key, JSON.stringify(envelope))
  } catch {
    // Quota full: the app still works online.
  }
}

/**
 * Called when the signed-in account changes, so tickets can't leak between
 * users. Pass keys to keep the rest (the saved profile survives a different
 * buyer signing in on the same device).
 */
export function clearOfflineCache(keys?: OfflineKey[]): void {
  const store = storage()
  if (!store) return

  const targets = keys?.map((key) => PREFIX + key)

  try {
    const stale: string[] = []
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index)
      if (!key?.startsWith(PREFIX)) continue
      if (!targets || targets.includes(key)) stale.push(key)
    }
    for (const key of stale) store.removeItem(key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
