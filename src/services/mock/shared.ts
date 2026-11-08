import { getDb, getSessionUserId, saveDb } from '@/mocks/db'
import type { Event, Role, TicketType, TicketTypeWithAvailability, User } from '@/types'
import { AppError } from '../errors'

/** Returns the signed-in user, or throws. Optionally enforces a role. */
export function requireUser(role?: Role): User {
  const userId = getSessionUserId()
  const user = getDb().users.find((candidate) => candidate.id === userId)
  if (!user) {
    throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.')
  }
  if (role && user.role !== role) {
    throw new AppError('FORBIDDEN', 'You do not have access to this action.')
  }
  const { password: _password, ...publicUser } = user
  return publicUser
}

/**
 * Lazy expiry: any pending order past its hold time becomes "expired".
 * Run before reading availability so expired holds never block buyers.
 * (The Supabase stage will also release holds with a scheduled job.)
 */
export function expireStaleOrders(): void {
  const db = getDb()
  const now = Date.now()
  let changed = false
  for (const order of db.orders) {
    if (order.status === 'pending' && new Date(order.expiresAt).getTime() <= now) {
      order.status = 'expired'
      changed = true
    }
  }
  if (changed) saveDb()
}

/** Tickets that count against quota: paid orders + unexpired pending holds. */
export function countTaken(ticketTypeId: string): number {
  let taken = 0
  for (const order of getDb().orders) {
    if (order.status !== 'paid' && order.status !== 'pending') continue
    for (const item of order.items) {
      if (item.ticketTypeId === ticketTypeId) taken += item.quantity
    }
  }
  return taken
}

export function withAvailability(ticketType: TicketType): TicketTypeWithAvailability {
  const remaining = Math.max(0, ticketType.quota - countTaken(ticketType.id))
  return { ...ticketType, remaining }
}

export function ticketTypesOf(eventId: string): TicketType[] {
  return getDb().ticketTypes.filter((ticketType) => ticketType.eventId === eventId)
}

export function findEvent(eventId: string): Event | undefined {
  return getDb().events.find((event) => event.id === eventId)
}

/** Organizers may only touch their own events. */
export function requireOwnEvent(eventId: string): Event {
  const organizer = requireUser('organizer')
  const event = findEvent(eventId)
  if (!event) throw new AppError('NOT_FOUND', 'Event not found.')
  if (event.organizerId !== organizer.id) {
    throw new AppError('FORBIDDEN', 'You can only manage your own events.')
  }
  return event
}
