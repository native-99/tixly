// Service contracts. The UI depends only on these interfaces.
// Today they are backed by mock implementations (./mock); a Supabase
// implementation will satisfy the same contracts later.

import type {
  CheckInResult,
  Event,
  EventDetail,
  EventSummary,
  Order,
  TicketType,
  TicketWithDetails,
  User,
} from '@/types'

export interface SignUpInput {
  fullName: string
  email: string
  password: string
}

export interface AuthService {
  getCurrentUser(): Promise<User | null>
  signIn(email: string, password: string): Promise<User>
  /** Public sign-up always creates a buyer account. */
  signUp(input: SignUpInput): Promise<User>
  signOut(): Promise<void>
}

export type EventInput = Pick<
  Event,
  'title' | 'description' | 'venue' | 'city' | 'startsAt' | 'posterUrl' | 'status'
>

export type TicketTypeInput = Pick<TicketType, 'name' | 'price' | 'quota'>

export interface EventService {
  /** Published events for buyers, soonest first. */
  listPublished(): Promise<EventSummary[]>
  getById(eventId: string): Promise<EventDetail | null>
  /** Events owned by the signed-in organizer. */
  listMine(): Promise<EventSummary[]>
  createEvent(input: EventInput): Promise<Event>
  updateEvent(eventId: string, input: EventInput): Promise<Event>
  createTicketType(eventId: string, input: TicketTypeInput): Promise<TicketType>
  updateTicketType(ticketTypeId: string, input: TicketTypeInput): Promise<TicketType>
  /** Stores a poster image and returns its URL (Supabase Storage later). */
  uploadPoster(file: File): Promise<string>
}

export interface CheckoutItemInput {
  ticketTypeId: string
  quantity: number
}

export interface OrderService {
  /** Reserves the tickets and holds them for HOLD_MINUTES. */
  createOrder(eventId: string, items: CheckoutItemInput[]): Promise<Order>
  getById(orderId: string): Promise<Order | null>
  /** Simulated payment success: marks the order paid and issues tickets. */
  payOrder(orderId: string): Promise<Order>
  cancelOrder(orderId: string): Promise<Order>
}

export interface TicketService {
  /** Tickets owned by the signed-in buyer. */
  listMine(): Promise<TicketWithDetails[]>
  /** Staff only. A ticket can be checked in exactly once. */
  checkIn(code: string): Promise<CheckInResult>
}

export interface Services {
  auth: AuthService
  events: EventService
  orders: OrderService
  tickets: TicketService
}
