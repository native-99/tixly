// A tiny localStorage-backed "database" for the mock services.
// Data survives page refreshes; call resetDb() to go back to the seed.

import { createSeed, type MockDb } from './seed'

// Bump the version when the seed changes, so browsers drop stale demo data.
const DB_KEY = 'tixly:db:v3'
const SESSION_KEY = 'tixly:session:v1'

let cache: MockDb | null = null

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode). The app still works in memory.
  }
}

export function getDb(): MockDb {
  if (cache) return cache

  const stored = readStorage(DB_KEY)
  if (stored) {
    try {
      cache = JSON.parse(stored) as MockDb
      return cache
    } catch {
      // Corrupted data — fall through and reseed.
    }
  }

  cache = createSeed()
  saveDb()
  return cache
}

export function saveDb(): void {
  if (cache) writeStorage(DB_KEY, JSON.stringify(cache))
}

export function resetDb(): void {
  cache = createSeed()
  saveDb()
  setSessionUserId(null)
}

// In-memory copy so the session still works when localStorage is unavailable.
let sessionUserId: string | null | undefined

export function getSessionUserId(): string | null {
  if (sessionUserId === undefined) sessionUserId = readStorage(SESSION_KEY)
  return sessionUserId
}

export function setSessionUserId(userId: string | null): void {
  sessionUserId = userId
  writeStorage(SESSION_KEY, userId)
}

/** Simulates network latency so loading states are visible. */
export function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

/** Unguessable ticket code, e.g. TX-7KQ2M9XRPA4D (12 random chars ≈ 60 bits). */
export function newTicketCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  let code = ''
  for (const byte of bytes) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  }
  return `TX-${code}`
}

/** Deep copy so callers can't mutate the stored data by accident. */
export function clone<T>(value: T): T {
  return structuredClone(value)
}
