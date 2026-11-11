/**
 * Seeds the local Supabase database with the demo data the app expects:
 * demo accounts, five events with ticket types, and a few paid orders with
 * QR codes (including the sample codes on the scan page).
 *
 * Usage: npm run db:seed
 * It uses the service-role key, so it can write rows that RLS hides.
 */
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(file) {
  if (!existsSync(file)) return {}
  const values = {}
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return values
}

const env = {
  ...loadEnvFile(join(root, '.env.local')),
  ...loadEnvFile(join(root, '.env')),
  ...process.env,
}

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    'Missing Supabase credentials.\n' +
      'Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local\n' +
      '(run `supabase status -o env` to see the local values).',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
})

const DEMO_PASSWORD = 'demo1234'

const USERS = [
  { key: 'buyer', email: 'buyer@tixly.dev', fullName: 'Budi Santoso', role: 'buyer' },
  { key: 'rina', email: 'rina@tixly.dev', fullName: 'Rina Wijaya', role: 'buyer' },
  { key: 'organizer', email: 'organizer@tixly.dev', fullName: 'Nusantara Live', role: 'organizer' },
  { key: 'staff', email: 'staff@tixly.dev', fullName: 'Andi (Gate A)', role: 'staff' },
  {
    key: 'crowd',
    email: 'crowd@tixly.dev',
    fullName: 'Other buyers',
    role: 'buyer',
    // Background sales belong to this account; the password is random so it
    // can't be used to sign in.
    password: randomUUID(),
  },
]

function daysFromNow(days, hour = 19) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const EVENTS = [
  {
    key: 'senja',
    title: 'Senja Sound Festival',
    description:
      'An open-air evening of indie and folk music, with local food stalls and art installations.',
    venue: 'Lapangan Banteng',
    city: 'Jakarta',
    category: 'festival',
    posterUrl: '/covers/senja-sound.svg',
    startsAt: daysFromNow(21, 16),
    status: 'published',
    ticketTypes: [
      { key: 'senja_early', name: 'Early Bird', price: 150_000, quota: 50 },
      { key: 'senja_reg', name: 'Regular', price: 250_000, quota: 200 },
      { key: 'senja_vip', name: 'VIP', price: 600_000, quota: 30 },
    ],
  },
  {
    key: 'comedy',
    title: 'Tawa Malam: Stand-Up Night',
    description: 'Five comedians, one night. Seats are limited and very close to the stage.',
    venue: 'Balai Pemuda',
    city: 'Surabaya',
    category: 'comedy',
    posterUrl: '/covers/tawa-malam.svg',
    startsAt: daysFromNow(9, 20),
    status: 'published',
    ticketTypes: [
      { key: 'comedy_front', name: 'Front Row', price: 300_000, quota: 2 },
      { key: 'comedy_reg', name: 'Regular', price: 175_000, quota: 80 },
    ],
  },
  {
    key: 'meetup',
    title: 'Bandung Tech Meetup',
    description: 'Talks on building products in Indonesia, followed by networking and coffee.',
    venue: 'Braga Creative Hub',
    city: 'Bandung',
    category: 'meetup',
    posterUrl: '/covers/bandung-tech.svg',
    startsAt: daysFromNow(14, 18),
    status: 'published',
    ticketTypes: [
      { key: 'meetup_reg', name: 'General Admission', price: 50_000, quota: 120 },
    ],
  },
  {
    key: 'run',
    title: 'Sunset Run 5K',
    description: 'A relaxed 5K beach run at sunset. Finisher medal and drinks included.',
    venue: 'Pantai Kuta',
    city: 'Bali',
    category: 'sports',
    posterUrl: '/covers/sunset-run.svg',
    startsAt: daysFromNow(35, 17),
    status: 'published',
    ticketTypes: [{ key: 'run_reg', name: 'Runner', price: 200_000, quota: 300 }],
  },
  {
    key: 'jazz',
    title: 'Jazz di Kota Lama',
    description: 'An intimate jazz evening. Lineup to be announced.',
    venue: 'Gedung Kesenian',
    city: 'Yogyakarta',
    category: 'music',
    posterUrl: '/covers/jazz-kota-lama.svg',
    startsAt: daysFromNow(60, 19),
    status: 'draft',
    ticketTypes: [{ key: 'jazz_reg', name: 'Regular', price: 220_000, quota: 100 }],
  },
]

/** Sold quantities for the fictional crowd, per ticket type key. */
const BACKGROUND_SALES = {
  senja_early: 50, // sold out
  senja_reg: 126,
  senja_vip: 24, // 6 left
  comedy_reg: 66,
  meetup_reg: 71,
  run_reg: 142,
}

/** Tickets that belong to the demo buyer, with the codes the scan page shows. */
const DEMO_TICKETS = [
  {
    orderKey: 'buyer_order',
    ticketTypeKey: 'senja_reg',
    quantity: 2,
    total: 500_000,
    tickets: [
      { code: 'TX-7KQ2M9XRPA4D', status: 'issued' },
      { code: 'TX-H3VN8WC5TJ6B', status: 'issued' },
    ],
  },
  {
    orderKey: 'rina_order',
    ticketTypeKey: 'comedy_front',
    quantity: 2,
    total: 600_000,
    tickets: [
      { code: 'TX-2PLD4YQ7GM9K', status: 'issued' },
      { code: 'TX-R8FS3NB6XW2E', status: 'checked_in' },
    ],
  },
]

function fail(message, error) {
  console.error(`✖ ${message}`)
  if (error) console.error(error)
  process.exit(1)
}

async function findUserByEmail(email) {
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error) fail(`Could not list users: ${error.message}`)
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (match) return match
    if (data.users.length < 100) return null
    page += 1
  }
}

async function upsertUser(user) {
  const existing = await findUserByEmail(user.email)
  const password = user.password ?? DEMO_PASSWORD

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: user.fullName },
    })
    if (error) fail(`Could not update ${user.email}: ${error.message}`)
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
  })
  if (error) fail(`Could not create ${user.email}: ${error.message}`)
  return data.user.id
}

async function main() {
  console.log('→ Creating demo accounts')
  const userIds = {}
  for (const user of USERS) {
    userIds[user.key] = await upsertUser(user)
  }

  // The trigger creates a profile on sign-up; here we set the role and the
  // organizer's gate link.
  const organizerId = userIds.organizer
  for (const user of USERS) {
    const { error } = await supabase
      .from('profiles')
      .update({
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        organizer_id: user.key === 'staff' ? organizerId : null,
      })
      .eq('id', userIds[user.key])
    if (error) fail(`Could not set the profile of ${user.email}: ${error.message}`)
  }

  console.log('→ Clearing previous demo data')
  // Deleted from the leaves up, because the foreign keys restrict deletes.
  for (const table of ['order_items', 'tickets', 'orders', 'ticket_types', 'events']) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (deleteError) fail(`Could not clear ${table}: ${deleteError.message}`)
  }

  console.log('→ Inserting events and ticket types')
  const eventIds = {}
  const ticketTypeIds = {}

  for (const event of EVENTS) {
    const id = randomUUID()
    eventIds[event.key] = id
    const { error } = await supabase.from('events').insert({
      id,
      organizer_id: organizerId,
      title: event.title,
      description: event.description,
      category: event.category,
      venue: event.venue,
      city: event.city,
      starts_at: event.startsAt,
      poster_url: event.posterUrl,
      status: event.status,
    })
    if (error) fail(`Could not insert ${event.title}: ${error.message}`)

    for (const ticketType of event.ticketTypes) {
      const ticketTypeId = randomUUID()
      ticketTypeIds[ticketType.key] = ticketTypeId
      const { error: ticketError } = await supabase.from('ticket_types').insert({
        id: ticketTypeId,
        event_id: id,
        name: ticketType.name,
        price: ticketType.price,
        quota: ticketType.quota,
      })
      if (ticketError) fail(`Could not insert ${ticketType.name}: ${ticketError.message}`)
    }
  }

  console.log('→ Inserting paid orders and tickets')
  const now = new Date().toISOString()

  for (const [ticketTypeKey, sold] of Object.entries(BACKGROUND_SALES)) {
    if (sold <= 0) continue
    const event = EVENTS.find((candidate) =>
      candidate.ticketTypes.some((ticketType) => ticketType.key === ticketTypeKey),
    )
    const ticketType = event.ticketTypes.find((candidate) => candidate.key === ticketTypeKey)
    const orderId = randomUUID()

    const { error } = await supabase.from('orders').insert({
      id: orderId,
      buyer_id: userIds.crowd,
      event_id: eventIds[event.key],
      status: 'paid',
      total: sold * ticketType.price,
      expires_at: now,
      created_at: now,
      paid_at: now,
    })
    if (error) fail(`Could not insert a background order: ${error.message}`)

    const { error: itemError } = await supabase.from('order_items').insert({
      id: randomUUID(),
      order_id: orderId,
      ticket_type_id: ticketTypeIds[ticketTypeKey],
      quantity: sold,
      unit_price: ticketType.price,
    })
    if (itemError) fail(`Could not insert a background order item: ${itemError.message}`)
  }

  for (const demo of DEMO_TICKETS) {
    const event = EVENTS.find((candidate) =>
      candidate.ticketTypes.some((ticketType) => ticketType.key === demo.ticketTypeKey),
    )
    const ticketType = event.ticketTypes.find(
      (candidate) => candidate.key === demo.ticketTypeKey,
    )
    const buyerId = demo.orderKey === 'rina_order' ? userIds.rina : userIds.buyer
    const orderId = randomUUID()

    const { error } = await supabase.from('orders').insert({
      id: orderId,
      buyer_id: buyerId,
      event_id: eventIds[event.key],
      status: 'paid',
      total: demo.total,
      expires_at: now,
      created_at: now,
      paid_at: now,
    })
    if (error) fail(`Could not insert a demo order: ${error.message}`)

    const { error: itemError } = await supabase.from('order_items').insert({
      id: randomUUID(),
      order_id: orderId,
      ticket_type_id: ticketTypeIds[demo.ticketTypeKey],
      quantity: demo.quantity,
      unit_price: ticketType.price,
    })
    if (itemError) fail(`Could not insert a demo order item: ${itemError.message}`)

    for (const ticket of demo.tickets) {
      const { error: ticketError } = await supabase.from('tickets').insert({
        id: randomUUID(),
        order_id: orderId,
        event_id: eventIds[event.key],
        ticket_type_id: ticketTypeIds[demo.ticketTypeKey],
        owner_id: buyerId,
        code: ticket.code,
        status: ticket.status,
        issued_at: now,
        checked_in_at: ticket.status === 'checked_in' ? now : null,
      })
      if (ticketError) fail(`Could not insert ticket ${ticket.code}: ${ticketError.message}`)
    }
  }

  console.log('\n✔ Seed complete\n')
  console.log('Demo accounts (password: demo1234)')
  for (const user of USERS) {
    if (user.key === 'crowd') continue
    console.log(`  ${user.role.padEnd(10)} ${user.email}`)
  }
  console.log('\nSample ticket codes for the scan page')
  for (const demo of DEMO_TICKETS) {
    for (const ticket of demo.tickets) {
      console.log(`  ${ticket.code}  ${ticket.status}`)
    }
  }
}

main().catch((error) => fail('Seeding failed', error))
