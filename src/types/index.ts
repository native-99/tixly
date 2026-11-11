// Shared domain types. These mirror the future Postgres schema,
// so the Supabase implementation can map rows 1:1 onto them.

export type Role = 'buyer' | 'organizer' | 'staff'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  /** Staff only: the organizer whose events this staff member checks in. */
  organizerId: string | null
}

export type EventStatus = 'draft' | 'published'

export type EventCategory = 'festival' | 'music' | 'comedy' | 'meetup' | 'sports' | 'arts'

export interface Event {
  id: string
  organizerId: string
  title: string
  description: string
  venue: string
  city: string
  category: EventCategory
  /** ISO 8601 date-time */
  startsAt: string
  posterUrl: string | null
  status: EventStatus
  createdAt: string
}

export interface TicketType {
  id: string
  eventId: string
  name: string
  /** Price in IDR (whole rupiah). */
  price: number
  quota: number
}

export interface TicketTypeWithAvailability extends TicketType {
  /** quota minus paid tickets minus tickets currently on hold */
  remaining: number
}

export interface EventSummary extends Event {
  minPrice: number | null
  /** Sum of all ticket type quotas. */
  capacity: number
  remaining: number
}

export interface EventDetail extends Event {
  ticketTypes: TicketTypeWithAvailability[]
}

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled'

export interface OrderItem {
  ticketTypeId: string
  quantity: number
  /** Price at the moment of checkout, so later price edits don't change old orders. */
  unitPrice: number
}

export interface Order {
  id: string
  buyerId: string
  eventId: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  /** Tickets are held until this time; after it, an unpaid order expires. */
  expiresAt: string
  createdAt: string
  paidAt: string | null
  /** "midtrans" for a real gateway, "simulated" for the in-app demo payment. */
  paymentProvider: string | null
  /** Gateway-hosted payment page, when there is one to redirect to. */
  paymentUrl: string | null
  /** Set once the ticket email has been handed to the mail server. */
  ticketsEmailedAt: string | null
}

/** Order history row: the order plus the event, before opening the detail page. */
export interface OrderSummary {
  id: string
  eventId: string
  status: OrderStatus
  total: number
  expiresAt: string
  createdAt: string
  paidAt: string | null
  ticketsEmailedAt: string | null
  /** How many tickets were issued for this order. */
  ticketCount: number
  event: {
    id: string
    title: string
    posterUrl: string | null
    category: EventCategory
    venue: string
    city: string
    startsAt: string
  }
}

export type TicketStatus = 'issued' | 'checked_in'
export interface Ticket {
  id: string
  orderId: string
  eventId: string
  ticketTypeId: string
  ownerId: string
  /** Random, unguessable code encoded in the QR. */
  code: string
  status: TicketStatus
  issuedAt: string
  checkedInAt: string | null
}

export interface TicketWithDetails extends Ticket {
  event: Pick<Event, 'id' | 'title' | 'venue' | 'city' | 'startsAt'>
  ticketTypeName: string
}

export type CheckInStatus = 'valid' | 'already_used' | 'invalid'

export interface CheckInResult {
  status: CheckInStatus
  ticket: TicketWithDetails | null
}
