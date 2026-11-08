import { clone, delay, getDb, saveDb } from '@/mocks/db'
import type { CheckInResult, Ticket, TicketWithDetails } from '@/types'
import { AppError } from '../errors'
import type { TicketService } from '../types'
import { findEvent, requireUser } from './shared'

function withDetails(ticket: Ticket): TicketWithDetails {
  const event = findEvent(ticket.eventId)
  const ticketType = getDb().ticketTypes.find((candidate) => candidate.id === ticket.ticketTypeId)
  if (!event || !ticketType) {
    throw new AppError('NOT_FOUND', 'Ticket data is incomplete.')
  }
  return {
    ...ticket,
    event: {
      id: event.id,
      title: event.title,
      venue: event.venue,
      city: event.city,
      startsAt: event.startsAt,
    },
    ticketTypeName: ticketType.name,
  }
}

export const mockTicketService: TicketService = {
  async listMine() {
    await delay()
    const buyer = requireUser('buyer')
    const mine = getDb().tickets.filter((ticket) => ticket.ownerId === buyer.id)
    const detailed = mine.map(withDetails)
    detailed.sort(
      (a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime(),
    )
    return clone(detailed)
  },

  async checkIn(code) {
    await delay(250)
    const staff = requireUser('staff')
    const ticket = getDb().tickets.find((candidate) => candidate.code === code.trim().toUpperCase())

    // Unknown code, or a ticket for another organizer's event: both are "invalid"
    // for this gate, and we don't reveal which.
    const event = ticket ? findEvent(ticket.eventId) : undefined
    if (!ticket || !event || event.organizerId !== staff.organizerId) {
      const result: CheckInResult = { status: 'invalid', ticket: null }
      return result
    }

    if (ticket.status === 'checked_in') {
      const result: CheckInResult = { status: 'already_used', ticket: clone(withDetails(ticket)) }
      return result
    }

    ticket.status = 'checked_in'
    ticket.checkedInAt = new Date().toISOString()
    saveDb()
    const result: CheckInResult = { status: 'valid', ticket: clone(withDetails(ticket)) }
    return result
  },
}
