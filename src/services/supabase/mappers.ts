import type {
  Event,
  EventCategory,
  EventDetail,
  EventStatus,
  EventSummary,
  Order,
  OrderItem,
  OrderStatus,
  OrderSummary,
  TicketStatus,
  TicketWithDetails,
} from '@/types'

export interface EventRow {
  id: string
  organizer_id: string
  title: string
  description: string
  category: EventCategory
  venue: string
  city: string
  starts_at: string
  poster_url: string | null
  status: EventStatus
  created_at: string
}

export interface EventSummaryRow extends EventRow {
  min_price: number | null
  capacity: number
  remaining: number
}

export interface EventDetailPayload {
  id: string
  organizerId: string
  title: string
  description: string
  category: EventCategory
  venue: string
  city: string
  startsAt: string
  posterUrl: string | null
  status: EventStatus
  createdAt: string
  ticketTypes: Array<{
    id: string
    eventId: string
    name: string
    price: number
    quota: number
    remaining: number
  }>
}

export interface OrderPayload {
  id: string
  buyerId: string
  eventId: string
  status: OrderStatus
  total: number
  expiresAt: string
  createdAt: string
  paidAt: string | null
  paymentProvider: string | null
  paymentUrl: string | null
  ticketsEmailedAt: string | null
  items: OrderItem[]
}

export interface TicketPayload {  id: string
  orderId: string
  eventId: string
  ticketTypeId: string
  ownerId: string
  code: string
  status: TicketStatus
  issuedAt: string
  checkedInAt: string | null
  ticketTypeName: string
  event: {
    id: string
    title: string
    venue: string
    city: string
    startsAt: string
  }
}

export function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    title: row.title,
    description: row.description,
    category: row.category,
    venue: row.venue,
    city: row.city,
    startsAt: row.starts_at,
    posterUrl: row.poster_url,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function toEventSummary(row: EventSummaryRow): EventSummary {
  return {
    ...toEvent(row),
    minPrice: row.min_price,
    capacity: row.capacity,
    remaining: row.remaining,
  }
}

export function toEventDetail(payload: EventDetailPayload): EventDetail {
  return {
    id: payload.id,
    organizerId: payload.organizerId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    venue: payload.venue,
    city: payload.city,
    startsAt: payload.startsAt,
    posterUrl: payload.posterUrl,
    status: payload.status,
    createdAt: payload.createdAt,
    ticketTypes: payload.ticketTypes,
  }
}

export function toOrder(payload: OrderPayload): Order {
  return {
    id: payload.id,
    buyerId: payload.buyerId,
    eventId: payload.eventId,
    status: payload.status,
    items: payload.items,
    total: payload.total,
    expiresAt: payload.expiresAt,
    createdAt: payload.createdAt,
    paidAt: payload.paidAt,
    paymentProvider: payload.paymentProvider ?? null,
    paymentUrl: payload.paymentUrl ?? null,
    ticketsEmailedAt: payload.ticketsEmailedAt ?? null,
  }
}

export function toTicket(payload: TicketPayload): TicketWithDetails {
  return {
    id: payload.id,
    orderId: payload.orderId,
    eventId: payload.eventId,
    ticketTypeId: payload.ticketTypeId,
    ownerId: payload.ownerId,
    code: payload.code,
    status: payload.status,
    issuedAt: payload.issuedAt,
    checkedInAt: payload.checkedInAt,
    ticketTypeName: payload.ticketTypeName,
    event: payload.event,
  }
}

export interface OrderSummaryRow {
  id: string
  event_id: string
  status: OrderStatus
  total: number
  expires_at: string
  created_at: string
  paid_at: string | null
  tickets_emailed_at: string | null
  event_title: string
  event_venue: string
  event_city: string
  event_starts_at: string
  event_poster_url: string | null
  event_category: EventCategory
  ticket_count: number
}

export function toOrderSummary(row: OrderSummaryRow): OrderSummary {
  return {
    id: row.id,
    eventId: row.event_id,
    status: row.status,
    total: row.total,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    ticketsEmailedAt: row.tickets_emailed_at,
    ticketCount: Number(row.ticket_count),
    event: {
      id: row.event_id,
      title: row.event_title,
      posterUrl: row.event_poster_url,
      category: row.event_category,
      venue: row.event_venue,
      city: row.event_city,
      startsAt: row.event_starts_at,
    },
  }
}
