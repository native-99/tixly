import { clone, delay, getDb, newId, saveDb } from '@/mocks/db'
import type { Event, EventSummary, TicketType } from '@/types'
import { AppError } from '../errors'
import type { EventInput, EventService, TicketTypeInput } from '../types'
import {
  expireStaleOrders,
  findEvent,
  requireOwnEvent,
  requireUser,
  ticketTypesOf,
  withAvailability,
} from './shared'

function toSummary(event: Event): EventSummary {
  const ticketTypes = ticketTypesOf(event.id).map(withAvailability)
  let minPrice: number | null = null
  let capacity = 0
  let remaining = 0
  for (const ticketType of ticketTypes) {
    if (minPrice === null || ticketType.price < minPrice) minPrice = ticketType.price
    capacity += ticketType.quota
    remaining += ticketType.remaining
  }
  return { ...event, minPrice, capacity, remaining }
}

function bySoonest(a: Event, b: Event): number {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
}

function validateEvent(input: EventInput): void {
  if (!input.title.trim()) throw new AppError('VALIDATION', 'Title is required.')
  if (!input.venue.trim()) throw new AppError('VALIDATION', 'Venue is required.')
  if (!input.city.trim()) throw new AppError('VALIDATION', 'City is required.')
  if (Number.isNaN(new Date(input.startsAt).getTime())) {
    throw new AppError('VALIDATION', 'Please choose a valid date and time.')
  }
}

function validateTicketType(input: TicketTypeInput): void {
  if (!input.name.trim()) throw new AppError('VALIDATION', 'Ticket name is required.')
  if (!Number.isInteger(input.price) || input.price < 0) {
    throw new AppError('VALIDATION', 'Price must be a whole number of rupiah.')
  }
  if (!Number.isInteger(input.quota) || input.quota < 1) {
    throw new AppError('VALIDATION', 'Quota must be at least 1.')
  }
}

export const mockEventService: EventService = {
  async listPublished() {
    await delay()
    expireStaleOrders()
    const published = getDb().events.filter((event) => event.status === 'published')
    return clone(published.sort(bySoonest).map(toSummary))
  },

  async getById(eventId) {
    await delay()
    expireStaleOrders()
    const event = findEvent(eventId)
    if (!event) return null

    // Drafts are visible only to their organizer.
    if (event.status === 'draft') {
      try {
        requireOwnEvent(eventId)
      } catch {
        return null
      }
    }

    const ticketTypes = ticketTypesOf(eventId).map(withAvailability)
    return clone({ ...event, ticketTypes })
  },

  async listMine() {
    await delay()
    expireStaleOrders()
    const organizer = requireUser('organizer')
    const mine = getDb().events.filter((event) => event.organizerId === organizer.id)
    return clone(mine.sort(bySoonest).map(toSummary))
  },

  async createEvent(input) {
    await delay()
    const organizer = requireUser('organizer')
    validateEvent(input)
    const event: Event = {
      ...input,
      id: newId('evt'),
      organizerId: organizer.id,
      createdAt: new Date().toISOString(),
    }
    getDb().events.push(event)
    saveDb()
    return clone(event)
  },

  async updateEvent(eventId, input) {
    await delay()
    const event = requireOwnEvent(eventId)
    validateEvent(input)
    Object.assign(event, input)
    saveDb()
    return clone(event)
  },

  async createTicketType(eventId, input) {
    await delay()
    requireOwnEvent(eventId)
    validateTicketType(input)
    const ticketType: TicketType = { ...input, id: newId('tt'), eventId }
    getDb().ticketTypes.push(ticketType)
    saveDb()
    return clone(ticketType)
  },

  async updateTicketType(ticketTypeId, input) {
    await delay()
    const ticketType = getDb().ticketTypes.find((candidate) => candidate.id === ticketTypeId)
    if (!ticketType) throw new AppError('NOT_FOUND', 'Ticket type not found.')
    requireOwnEvent(ticketType.eventId)
    validateTicketType(input)

    expireStaleOrders()
    const alreadyTaken = ticketType.quota - withAvailability(ticketType).remaining
    if (input.quota < alreadyTaken) {
      throw new AppError(
        'VALIDATION',
        `Quota can't be lower than the ${alreadyTaken} tickets already sold or on hold.`,
      )
    }

    Object.assign(ticketType, input)
    saveDb()
    return clone(ticketType)
  },
}
