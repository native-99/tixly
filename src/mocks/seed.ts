import { DEMO_PASSWORD, DEMO_TICKET_CODES } from '@/config/demo'
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
const BACKGROUND_BUYER_ID = 'usr_crowd'

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
      // Owner of the background sales; cannot sign in (no usable password).
      id: BACKGROUND_BUYER_ID,
      email: 'crowd@tixly.invalid',
      fullName: 'Other buyers',
      role: 'buyer',
      organizerId: null,
      password: '',
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

  const event = (
    data: Omit<Event, 'organizerId' | 'createdAt' | 'posterUrl'> & { posterUrl?: string | null },
  ): Event => ({
    posterUrl: null,
    ...data,
    organizerId: ORGANIZER_ID,
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
      category: 'festival',
      posterUrl: '/covers/senja-sound.svg',
      startsAt: daysFromNow(21, 16),
      status: 'published',
    }),
    event({
      id: 'evt_comedy',
      title: 'Tawa Malam: Stand-Up Night',
      description: 'Five comedians, one night. Seats are limited and very close to the stage.',
      venue: 'Balai Pemuda',
      city: 'Surabaya',
      category: 'comedy',
      posterUrl: '/covers/tawa-malam.svg',
      startsAt: daysFromNow(9, 20),
      status: 'published',
    }),
    event({
      id: 'evt_meetup',
      title: 'Bandung Tech Meetup',
      description: 'Talks on building products in Indonesia, followed by networking and coffee.',
      venue: 'Braga Creative Hub',
      city: 'Bandung',
      category: 'meetup',
      posterUrl: '/covers/bandung-tech.svg',
      startsAt: daysFromNow(14, 18),
      status: 'published',
    }),
    event({
      id: 'evt_run',
      title: 'Sunset Run 5K',
      description: 'A relaxed 5K beach run at sunset. Finisher medal and drinks included.',
      venue: 'Pantai Kuta',
      city: 'Bali',
      category: 'sports',
      posterUrl: '/covers/sunset-run.svg',
      startsAt: daysFromNow(35, 17),
      status: 'published',
    }),
    event({
      id: 'evt_jazz',
      title: 'Jazz di Kota Lama',
      description: 'An intimate jazz evening. Lineup to be announced.',
      venue: 'Gedung Kesenian',
      city: 'Yogyakarta',
      category: 'music',
      posterUrl: '/covers/jazz-kota-lama.svg',
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
      paymentProvider: 'simulated',
      paymentUrl: null,
      ticketsEmailedAt: now,
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
      paymentProvider: 'simulated',
      paymentUrl: null,
      ticketsEmailedAt: now,
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

  const usedTicket = ticket('tkt_seed_4', orders[1], 'tt_comedy_front', DEMO_TICKET_CODES.used)
  usedTicket.status = 'checked_in'
  usedTicket.checkedInAt = now

  const tickets: Ticket[] = [
    ticket('tkt_seed_1', orders[0], 'tt_senja_reg', DEMO_TICKET_CODES.ready),
    ticket('tkt_seed_2', orders[0], 'tt_senja_reg', DEMO_TICKET_CODES.ready2),
    ticket('tkt_seed_3', orders[1], 'tt_comedy_front', DEMO_TICKET_CODES.ready3),
    usedTicket,
  ]

  addBackgroundSales(orders, tickets, ticketTypes, now)

  return { users, events, ticketTypes, orders, tickets }
}

/**
 * Paid orders from other (fictional) buyers, so sales numbers and
 * "Only N left" badges look realistic in the demo.
 */
function addBackgroundSales(orders: Order[], tickets: Ticket[], ticketTypes: TicketType[], now: string) {
  const sales: Array<[ticketTypeId: string, sold: number]> = [
    ['tt_senja_early', 50], // sold out
    ['tt_senja_reg', 128],
    ['tt_senja_vip', 24], // 6 left
    ['tt_comedy_reg', 66],
    ['tt_meetup_reg', 71],
    ['tt_run_reg', 142],
  ]
  const ORDER_SIZE = 4
  let counter = 0

  for (const [ticketTypeId, sold] of sales) {
    const ticketType = ticketTypes.find((candidate) => candidate.id === ticketTypeId)
    if (!ticketType) continue

    for (let start = 0; start < sold; start += ORDER_SIZE) {
      counter++
      const quantity = Math.min(ORDER_SIZE, sold - start)
      const order: Order = {
        id: `ord_bg_${counter}`,
        buyerId: BACKGROUND_BUYER_ID,
        eventId: ticketType.eventId,
        status: 'paid',
        items: [{ ticketTypeId, quantity, unitPrice: ticketType.price }],
        total: quantity * ticketType.price,
        expiresAt: now,
        createdAt: now,
        paidAt: now,
        paymentProvider: 'simulated',
        paymentUrl: null,
        ticketsEmailedAt: now,
      }
      orders.push(order)

      for (let index = 0; index < quantity; index++) {
        tickets.push({
          id: `tkt_bg_${counter}_${index}`,
          orderId: order.id,
          eventId: order.eventId,
          ticketTypeId,
          ownerId: BACKGROUND_BUYER_ID,
          code: `TX-BG${String(counter).padStart(5, '0')}${index}`,
          status: 'issued',
          issuedAt: now,
          checkedInAt: null,
        })
      }
    }
  }
}
