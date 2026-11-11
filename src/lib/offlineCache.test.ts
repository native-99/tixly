import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearOfflineCache, readOfflineCache, writeOfflineCache } from './offlineCache'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()

  get length() {
    return this.data.size
  }

  clear() {
    this.data.clear()
  }

  getItem(key: string) {
    return this.data.get(key) ?? null
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.data.delete(key)
  }

  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

describe('offlineCache', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
    vi.stubGlobal('window', { localStorage: storage })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips a saved list', () => {
    const tickets = [{ id: 'tkt_1', code: 'TX-1' }]
    writeOfflineCache('tickets', tickets)
    expect(readOfflineCache('tickets')).toEqual(tickets)
  })

  it('keeps the two lists apart', () => {
    writeOfflineCache('tickets', [{ id: 'tkt_1' }])
    writeOfflineCache('orders', [{ id: 'ord_1' }])
    expect(readOfflineCache('tickets')).toEqual([{ id: 'tkt_1' }])
    expect(readOfflineCache('orders')).toEqual([{ id: 'ord_1' }])
  })

  it('clears only its own keys on sign-out', () => {
    storage.setItem('unrelated', 'keep me')
    writeOfflineCache('tickets', [{ id: 'tkt_1' }])
    writeOfflineCache('orders', [{ id: 'ord_1' }])

    clearOfflineCache()

    expect(readOfflineCache('tickets')).toBeNull()
    expect(readOfflineCache('orders')).toBeNull()
    expect(storage.getItem('unrelated')).toBe('keep me')
  })

  it('can keep the saved profile while dropping another account’s lists', () => {
    writeOfflineCache('profile', { id: 'usr_1' })
    writeOfflineCache('tickets', [{ id: 'tkt_1' }])

    clearOfflineCache(['tickets'])

    expect(readOfflineCache('tickets')).toBeNull()
    expect(readOfflineCache('profile')).toEqual({ id: 'usr_1' })
  })

  it('ignores corrupt or older cached values', () => {
    storage.setItem('tixly.offline.v1.tickets', '{not json')
    expect(readOfflineCache('tickets')).toBeNull()

    storage.setItem(
      'tixly.offline.v1.orders',
      JSON.stringify({ version: 0, savedAt: '', data: [{ id: 'old' }] }),
    )
    expect(readOfflineCache('orders')).toBeNull()
  })

  it('does nothing when storage is unavailable', () => {
    vi.stubGlobal('window', undefined)
    expect(() => writeOfflineCache('tickets', [])).not.toThrow()
    expect(readOfflineCache('tickets')).toBeNull()
    expect(() => clearOfflineCache()).not.toThrow()
  })
})
