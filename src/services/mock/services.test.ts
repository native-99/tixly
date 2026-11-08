import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_PASSWORD, DEMO_TICKET_CODES } from '@/config/demo'
import { getDb, resetDb, saveDb } from '@/mocks/db'
import { services } from '@/services'
import type { AppErrorCode } from '@/services'

const signInAs = (email: string) => services.auth.signIn(email, DEMO_PASSWORD)
const asBuyer = () => signInAs('buyer@tixly.dev')
const asOrganizer = () => signInAs('organizer@tixly.dev')
const asStaff = () => signInAs('staff@tixly.dev')

async function expectError(promise: Promise<unknown>, code: AppErrorCode) {
  await expect(promise).rejects.toMatchObject({ code })
}

async function remainingOf(eventId: string, ticketTypeId: string): Promise<number> {
  const event = await services.events.getById(eventId)
  const ticketType = event?.ticketTypes.find((candidate) => candidate.id === ticketTypeId)
  if (!ticketType) throw new Error(`ticket type ${ticketTypeId} not found`)
  return ticketType.remaining
}

beforeEach(() => {
  resetDb()
})

describe('auth', () => {
  it('signs in with the right password and rejects the wrong one', async () => {
    await expectError(services.auth.signIn('buyer@tixly.dev', 'nope'), 'INVALID_CREDENTIALS')
    const user = await asBuyer()
    expect(user.role).toBe('buyer')
    expect(user).not.toHaveProperty('password')
  })

  it('never accepts an empty password', async () => {
    await expectError(services.auth.signIn('crowd@tixly.invalid', ''), 'INVALID_CREDENTIALS')
  })

  it('creates buyer accounts on sign-up and blocks duplicate emails', async () => {
    const user = await services.auth.signUp({ fullName: 'Zen', email: 'Zen@Test.dev', password: 'password1' })
    expect(user).toMatchObject({ role: 'buyer', email: 'zen@test.dev' })
    await expectError(
      services.auth.signUp({ fullName: 'Zen 2', email: 'zen@test.dev', password: 'password1' }),
      'EMAIL_TAKEN',
    )
  })
})

describe('events', () => {
  it('lists only published events, soonest first', async () => {
    const events = await services.events.listPublished()
    expect(events.length).toBeGreaterThan(0)
    expect(events.every((event) => event.status === 'published')).toBe(true)
    const times = events.map((event) => new Date(event.startsAt).getTime())
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })

  it('hides drafts from everyone except their organizer', async () => {
    expect(await services.events.getById('evt_jazz')).toBeNull()
    await asBuyer()
    expect(await services.events.getById('evt_jazz')).toBeNull()
    await asOrganizer()
    expect(await services.events.getById('evt_jazz')).not.toBeNull()
  })

  it('only lets organizers manage events', async () => {
    await expectError(services.events.listMine(), 'UNAUTHENTICATED')
    await asBuyer()
    await expectError(services.events.listMine(), 'FORBIDDEN')
  })

  it("won't lower a quota below tickets already taken", async () => {
    await asOrganizer()
    // Seed: 24 of 30 VIP tickets are sold.
    await expectError(
      services.events.updateTicketType('tt_senja_vip', { name: 'VIP', price: 600_000, quota: 10 }),
      'VALIDATION',
    )
    const updated = await services.events.updateTicketType('tt_senja_vip', {
      name: 'VIP',
      price: 600_000,
      quota: 24,
    })
    expect(updated.quota).toBe(24)
  })
})

describe('orders', () => {
  it('holds tickets so they stop counting as available', async () => {
    await asBuyer()
    const before = await remainingOf('evt_senja', 'tt_senja_vip')
    const order = await services.orders.createOrder('evt_senja', [{ ticketTypeId: 'tt_senja_vip', quantity: 3 }])
    expect(order.status).toBe('pending')
    expect(order.total).toBe(1_800_000)
    expect(await remainingOf('evt_senja', 'tt_senja_vip')).toBe(before - 3)
  })

  it('never sells more than the quota', async () => {
    await asBuyer()
    // Seed leaves 6 VIP tickets.
    await expectError(
      services.orders.createOrder('evt_senja', [{ ticketTypeId: 'tt_senja_vip', quantity: 7 }]),
      'VALIDATION', // above the per-order limit of 5
    )
    await services.orders.createOrder('evt_senja', [{ ticketTypeId: 'tt_senja_vip', quantity: 5 }])
    await expectError(
      services.orders.createOrder('evt_senja', [{ ticketTypeId: 'tt_senja_vip', quantity: 2 }]),
      'SOLD_OUT',
    )
    await expectError(
      services.orders.createOrder('evt_comedy', [{ ticketTypeId: 'tt_comedy_front', quantity: 1 }]),
      'SOLD_OUT',
    )
  })

  it('releases expired holds and refuses to take payment for them', async () => {
    await asBuyer()
    const before = await remainingOf('evt_senja', 'tt_senja_vip')
    const order = await services.orders.createOrder('evt_senja', [{ ticketTypeId: 'tt_senja_vip', quantity: 2 }])

    const stored = getDb().orders.find((candidate) => candidate.id === order.id)
    if (!stored) throw new Error('order not stored')
    stored.expiresAt = new Date(Date.now() - 1000).toISOString()
    saveDb()

    expect(await remainingOf('evt_senja', 'tt_senja_vip')).toBe(before)
    await expectError(services.orders.payOrder(order.id), 'ORDER_EXPIRED')
  })

  it('issues tickets once, even if payment is confirmed twice', async () => {
    await asBuyer()
    const ticketsBefore = (await services.tickets.listMine()).length
    const order = await services.orders.createOrder('evt_senja', [{ ticketTypeId: 'tt_senja_reg', quantity: 2 }])
    await services.orders.payOrder(order.id)
    await services.orders.payOrder(order.id)
    expect((await services.tickets.listMine()).length).toBe(ticketsBefore + 2)
  })

  it("hides other buyers' orders", async () => {
    await asBuyer()
    const order = await services.orders.createOrder('evt_senja', [{ ticketTypeId: 'tt_senja_reg', quantity: 1 }])
    await services.auth.signUp({ fullName: 'Other', email: 'other@test.dev', password: 'password1' })
    expect(await services.orders.getById(order.id)).toBeNull()
    await expectError(services.orders.payOrder(order.id), 'NOT_FOUND')
  })
})

describe('check-in', () => {
  it('accepts a ticket once, then reports it as used', async () => {
    await asStaff()
    const first = await services.tickets.checkIn(DEMO_TICKET_CODES.ready)
    expect(first.status).toBe('valid')
    const second = await services.tickets.checkIn(DEMO_TICKET_CODES.ready)
    expect(second.status).toBe('already_used')
  })

  it('normalises the scanned code', async () => {
    await asStaff()
    const result = await services.tickets.checkIn(`  ${DEMO_TICKET_CODES.ready.toLowerCase()} `)
    expect(result.status).toBe('valid')
  })

  it('rejects unknown codes without revealing details', async () => {
    await asStaff()
    expect(await services.tickets.checkIn('TX-DOESNOTEXIST')).toEqual({ status: 'invalid', ticket: null })
  })

  it('only lets staff check tickets in', async () => {
    await asBuyer()
    await expectError(services.tickets.checkIn(DEMO_TICKET_CODES.ready), 'FORBIDDEN')
  })
})
