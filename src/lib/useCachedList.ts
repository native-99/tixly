import { useEffect } from 'react'
import { readOfflineCache, writeOfflineCache, type OfflineKey } from './offlineCache'

interface CachedList<T> {
  /** Fresh data when available, otherwise the last saved copy. */
  items: T[]
  /** True when the request failed and the saved copy is what's on screen. */
  usingCache: boolean
}

/**
 * Keeps a copy of a successfully loaded list and uses it when the request
 * fails. The page still shows the real error if there is nothing saved yet.
 */
export function useCachedList<T>(
  key: OfflineKey,
  remote: T[] | undefined,
  isError: boolean,
): CachedList<T> {
  useEffect(() => {
    if (remote) writeOfflineCache(key, remote)
  }, [key, remote])

  // Reading on each render is fine here: these lists are small, and it avoids a
  // second render just to copy localStorage into state.
  const cached = readOfflineCache<T[]>(key)

  return {
    items: remote ?? cached ?? [],
    usingCache: isError && cached !== null,
  }
}
