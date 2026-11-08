import { clone, delay, getDb, newId, newTicketCode, saveDb } from '@/mocks/db'
import type { Order, OrderItem, Ticket } from '@/types'
import { HOLD_MINUTES, MAX_QTY_PER_ITEM } from '../constants'
import { AppError } from '../errors'
import type { OrderService } from '../types'
import { expireStaleOrders, findEvent, requireUser, withAvailability } from './shared'

/** Buyers may only see and act on their own orders. */
function requireOwnOrder(orderId: string): Order {
  const buyer = requireUser('buyer')
  expireStaleOrders()
  const order = getDb().orders.find((candidate) => candidate.id === orderId)
  if (!order || order.buyerId !== buyer.id) {
    throw new AppError('NOT_FOUND', 'Order not found.')
  }
  return order
}

export const mockOrderService: OrderService = {
  async createOrder(eventId, items) {
    await delay()
    const buyer = requireUser('buyer')
    const event = findEvent(eventId)
    if (!event || event.status !== 'published') {
      throw new AppError('NOT_FOUND', 'Event not found.')
    }

    const wanted = items.filter((item) => item.quantity > 0)
    if (wanted.length === 0) {
      throw new AppError('VALIDATION', 'Choose at least one ticket.')
    }

    // NOTE: in the browser this check-then-write runs in a single thread, so it
    // can't oversell. The Supabase stage moves this into one atomic Postgres
    // function, which is what actually protects quota under concurrent load.
    expireStaleOrders()
    const db = getDb()
    const orderItems: OrderItem[] = []
    for (const item of wanted) {
      if (!Number.isInteger(item.quantity) || item.quantity > MAX_QTY_PER_ITEM) {
        throw new AppError('VALIDATION', `You can buy up to ${MAX_QTY_PER_ITEM} per ticket type.`)
      }
      const ticketType = db.ticketTypes.find((candidate) => candidate.id === item.ticketTypeId)
      if (!ticketType || ticketType.eventId !== eventId) {
        throw new AppError('NOT_FOUND', 'Ticket type not found.')
      }
      const { remaining } = withAvailability(ticketType)
      if (item.quantity > remaining) {
        throw new AppError(
          'SOLD_OUT',
          remaining === 0
            ? `${ticketType.name} is sold out.`
            : `Only ${remaining} ${ticketType.name} ticket(s) left.`,
        )
      }
      orderItems.push({
        ticketTypeId: ticketType.id,
        quantity: item.quantity,
        unitPrice: ticketType.price,
      })
    }

    let total = 0
    for (const item of orderItems) total += item.unitPrice * item.quantity

    const now = new Date()
    const order: Order = {
      id: newId('ord'),
      buyerId: buyer.id,
      eventId,
      status: 'pending',
      items: orderItems,
      total,
      expiresAt: new Date(now.getTime() + HOLD_MINUTES * 60_000).toISOString(),
      createdAt: now.toISOString(),
      paidAt: null,
    }
    db.orders.push(order)
    saveDb()
    return clone(order)
  },

  async getById(orderId) {
    await delay()
    try {
      return clone(requireOwnOrder(orderId))
    } catch (error) {
      if (error instanceof AppError && error.code === 'NOT_FOUND') return null
      throw error
    }
  },

  async payOrder(orderId) {
    await delay(800)
    const order = requireOwnOrder(orderId)
    if (order.status === 'paid') return clone(order) // paying twice is a no-op
    if (order.status === 'expired') {
      throw new AppError('ORDER_EXPIRED', 'Your hold expired. Please start checkout again.')
    }
    if (order.status !== 'pending') {
      throw new AppError('INVALID_STATE', 'This order can no longer be paid.')
    }

    const now = new Date().toISOString()
    order.status = 'paid'
    order.paidAt = now

    const db = getDb()
    for (const item of order.items) {
      for (let index = 0; index < item.quantity; index++) {
        const ticket: Ticket = {
          id: newId('tkt'),
          orderId: order.id,
          eventId: order.eventId,
          ticketTypeId: item.ticketTypeId,
          ownerId: order.buyerId,
          code: newTicketCode(),
          status: 'issued',
          issuedAt: now,
          checkedInAt: null,
        }
        db.tickets.push(ticket)
      }
    }
    saveDb()
    return clone(order)
  },

  async cancelOrder(orderId) {
    await delay()
    const order = requireOwnOrder(orderId)
    if (order.status !== 'pending') {
      throw new AppError('INVALID_STATE', 'Only unpaid orders can be cancelled.')
    }
    order.status = 'cancelled'
    saveDb()
    return clone(order)
  },
}
