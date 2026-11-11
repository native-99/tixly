import { AppError } from '../errors'
import type { OrderService, PaymentSession, TicketEmailResult } from '../types'
import { getSupabase } from './client'
import { mapSupabaseError } from './errors'
import { toOrder, toOrderSummary, type OrderPayload, type OrderSummaryRow } from './mappers'

/**
 * Calls an Edge Function and surfaces its `{ error }` body instead of the
 * generic "non-2xx status code" message that supabase-js returns.
 */
async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke(name, { body })
  if (!error) return data as T

  let message = error.message
  const context = (error as { context?: unknown }).context
  if (context instanceof Response) {
    const payload = (await context
      .clone()
      .json()
      .catch(() => null)) as { error?: string } | null
    if (payload?.error) message = payload.error
  }
  throw new AppError('PAYMENT', message)
}

export const supabaseOrderService: OrderService = {
  async createOrder(eventId, items) {
    const { data, error } = await getSupabase().rpc('create_order', {
      p_event_id: eventId,
      p_items: items
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
        })),
    })

    if (error) throw mapSupabaseError(error)
    return toOrder(data as OrderPayload)
  },

  async getById(orderId) {
    const { data, error } = await getSupabase().rpc('get_order', { p_order_id: orderId })
    if (error) throw mapSupabaseError(error)
    if (!data) return null
    return toOrder(data as OrderPayload)
  },

  async startPayment(orderId) {
    return invokeFunction<PaymentSession>('create-payment', { orderId })
  },

  async payOrder(orderId) {
    const { data, error } = await getSupabase().rpc('pay_order', { p_order_id: orderId })
    if (error) throw mapSupabaseError(error)
    return toOrder(data as OrderPayload)
  },

  async cancelOrder(orderId) {
    const { data, error } = await getSupabase().rpc('cancel_order', { p_order_id: orderId })
    if (error) throw mapSupabaseError(error)
    return toOrder(data as OrderPayload)
  },

  async sendTickets(orderId, options) {
    return invokeFunction<TicketEmailResult>('send-tickets', {
      orderId,
      resend: options?.resend === true,
    })
  },

  async listMine() {
    const { data, error } = await getSupabase().rpc('list_my_orders')
    if (error) throw mapSupabaseError(error)
    return (data as OrderSummaryRow[]).map(toOrderSummary)
  },
}
