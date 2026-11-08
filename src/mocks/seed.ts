import { DEMO_PASSWORD } from '@/config/demo'
import type { Event, Order, Ticket, TicketType, User } from '@/types'

export interface MockUser extends User {
  /** Mock only — real auth (Supabase) never exposes passwords. */
  password: string
}

export interface MockDb {
  users: MockUser[]
  events: Event[]
  ticketTypes: TicketType[]
  orders: Order[]
  tickets: Ticket[]
}

const ORGANIZER_ID = 'usr_organizer'
const BUYER_ID = 'usr_buyer'
const OTHER_BUYER_ID = 'usr_buyer_2'

function daysFromNow(days: number, hour = 19): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export function createSeed(): MockDb {
  const now = new Date().toISOString()

  const users: MockUser[] = [
    {
      id: BUYER_ID,
      email: 'buyer@tixly.dev',
      fullName: 'Budi Santoso',
      role: 'buyer',
      organizerId: null,
      password: DEMO_PASSWORD,
    },
    {
      id: OTHER_BUYER_ID,
      email: 'rina@tixly.dev',
      fullName: 'Rina Wijaya',
      role: 'buyer',
      organizerId: null,
      password: DEMO_PASSWORD,
    },
    {
      id: ORGANIZER_ID,
      email: 'organizer@tixly.dev',
      fullName: 'Nusantara Live',
      role: 'organizer',
      organizerId: null,
      password: DEMO_PASSWORD,
    },
    {
      id: 'usr_staff',
      email: 'staff@tixly.dev',
      fullName: 'Andi (Gate A)',
      role: 'staff',
      organizerId: ORGANIZER_ID,
      password: DEMO_PASSWORD,
    },
  ]

  const event = (data: Omit<Event, 'organizerId' | 'posterUrl' | 'createdAt'>): Event => ({
    ...data,
    organizerId: ORGANIZER_ID,
    posterUrl: null,
    createdAt: now,
  })

  const events: Event[] = [
    event({
      id: 'evt_senja',
      title: 'Senja Sound Festival',
      description:
        'An open-air evening of indie and folk music, with local food stalls and art installations.',
      venue: 'Lapangan Banteng',
      city: 'Jakarta',
      startsAt: daysFromNow(21, 16),
      status: 'published',
    }),
    event({
      id: 'evt_comedy',
      title: 'Tawa Malam: Stand-Up Night',
      description: 'Five comedians, one night. Seats are limited and very close to the stage.',
      venue: 'Balai Pemuda',
      city: 'Surabaya',
      startsAt: daysFromNow(9, 20),
      status: 'published',
    }),
    event({
      id: 'evt_meetup',
      title: 'Bandung Tech Meetup',
      description: 'Talks on building products in Indonesia, followed by networking and coffee.',
      venue: 'Braga Creative Hub',
      city: 'Bandung',
      startsAt: daysFromNow(14, 18),
      status: 'published',
    }),
    event({
      id: 'evt_run',
      title: 'Sunset Run 5K',
      description: 'A relaxed 5K beach run at sunset. Finisher medal and drinks included.',
      venue: 'Pantai Kuta',
      city: 'Bali',
      startsAt: daysFromNow(35, 17),
      status: 'published',
    }),
    event({
      id: 'evt_jazz',
      title: 'Jazz di Kota Lama',
      description: 'An intimate jazz evening. Lineup to be announced.',
      venue: 'Gedung Kesenian',
      city: 'Yogyakarta',
      startsAt: daysFromNow(60, 19),
      status: 'draft',
    }),
  ]

  const ticketTypes: TicketType[] = [
    { id: 'tt_senja_early', eventId: 'evt_senja', name: 'Early Bird', price: 150_000, quota: 50 },
    { id: 'tt_senja_reg', eventId: 'evt_senja', name: 'Regular', price: 250_000, quota: 200 },
    { id: 'tt_senja_vip', eventId: 'evt_senja', name: 'VIP', price: 600_000, quota: 30 },
    { id: 'tt_comedy_front', eventId: 'evt_comedy', name: 'Front Row', price: 300_000, quota: 2 },
    { id: 'tt_comedy_reg', eventId: 'evt_comedy', name: 'Regular', price: 175_000, quota: 80 },
    { id: 'tt_meetup_reg', eventId: 'evt_meetup', name: 'General Admission', price: 50_000, quota: 120 },
    { id: 'tt_run_reg', eventId: 'evt_run', name: 'Runner', price: 200_000, quota: 300 },
    { id: 'tt_jazz_reg', eventId: 'evt_jazz', name: 'Regular', price: 220_000, quota: 100 },
  ]

  const orders: Order[] = [
    {
      id: 'ord_seed_1',
      buyerId: BUYER_ID,
      eventId: 'evt_senja',
      status: 'paid',
      items: [{ ticketTypeId: 'tt_senja_reg', quantity: 2, unitPrice: 250_000 }],
      total: 500_000,
      expiresAt: now,
      createdAt: now,
      paidAt: now,
    },
    {
      // Buys out the Front Row tier so the "sold out" state is visible in the demo.
      id: 'ord_seed_2',
      buyerId: OTHER_BUYER_ID,
      eventId: 'evt_comedy',
      status: 'paid',
      items: [{ ticketTypeId: 'tt_comedy_front', quantity: 2, unitPrice: 300_000 }],
      total: 600_000,
      expiresAt: now,
      createdAt: now,
      paidAt: now,
    },
  ]

  const ticket = (
    id: string,
    order: Order,
    ticketTypeId: string,
    code: string,
  ): Ticket => ({
    id,
    orderId: order.id,
    eventId: order.eventId,
    ticketTypeId,
    ownerId: order.buyerId,
    code,
    status: 'issued',
    issuedAt: now,
    checkedInAt: null,
  })

  const tickets: Ticket[] = [
    ticket('tkt_seed_1', orders[0], 'tt_senja_reg', 'TX-7KQ2M9XRPA4D'),
    ticket('tkt_seed_2', orders[0], 'tt_senja_reg', 'TX-H3VN8WC5TJ6B'),
    ticket('tkt_seed_3', orders[1], 'tt_comedy_front', 'TX-2PLD4YQ7GM9K'),
    ticket('tkt_seed_4', orders[1], 'tt_comedy_front', 'TX-R8FS3NB6XW2E'),
  ]

  return { users, events, ticketTypes, orders, tickets }
}
