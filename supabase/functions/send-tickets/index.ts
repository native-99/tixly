// Sends (or resends) the ticket email for one of the caller's own paid orders.
//
// The Midtrans webhook normally sends the email, but two paths need this:
// simulated payments (demo mode, no gateway) and a buyer who never got the mail.

import { handleOptions, json, serviceClient, userClient } from '../_shared/http.ts'
import { sendTicketEmail, type TicketEmailPayload } from '../_shared/email.ts'

Deno.serve(async (request) => {
  const preflight = handleOptions(request)
  if (preflight) return preflight

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'Missing Authorization header' }, 401)

  let orderId: string
  let resend = false
  try {
    const body = await request.json()
    orderId = String(body?.orderId ?? '')
    resend = body?.resend === true
  } catch {
    return json({ error: 'Expected a JSON body with { orderId }' }, 400)
  }
  if (!orderId) return json({ error: 'orderId is required' }, 400)

  // Ownership is checked by get_order, which only returns the buyer's own order.
  const asUser = userClient(authorization)
  const { data: order, error: orderError } = await asUser.rpc('get_order', { p_order_id: orderId })
  if (orderError) return json({ error: orderError.message }, 400)
  if (!order) return json({ error: 'Order not found' }, 404)
  if (order.status !== 'paid') return json({ error: 'Tickets are only sent for paid orders' }, 409)

  const admin = serviceClient()

  // Claim the send so a webhook race can't email the buyer twice.
  if (!resend) {
    const { data: claimed, error: claimError } = await admin.rpc('claim_ticket_email', {
      p_order_id: orderId,
    })
    if (claimError) return json({ error: claimError.message }, 500)
    if (!claimed) {
      return json({ sent: false, alreadySent: true, emailedAt: order.ticketsEmailedAt ?? null })
    }
  }

  const release = async () => {
    if (!resend) await admin.rpc('release_ticket_email', { p_order_id: orderId })
  }

  const { data: payload, error: payloadError } = await admin.rpc('ticket_email_payload', {
    p_order_id: orderId,
  })
  if (payloadError || !payload) {
    await release()
    return json({ error: payloadError?.message ?? 'Order not found' }, 500)
  }

  const email = payload as TicketEmailPayload
  if (!email.buyerEmail) {
    await release()
    return json({ error: 'This account has no email address' }, 400)
  }

  try {
    const transport = await sendTicketEmail(email)
    const emailedAt = new Date().toISOString()
    await admin.from('orders').update({ tickets_emailed_at: emailedAt }).eq('id', orderId)
    return json({ sent: true, transport, emailedAt, to: email.buyerEmail })
  } catch (error) {
    await release()
    console.error('Ticket email failed', error instanceof Error ? error.message : String(error))
    return json({ error: 'Could not send the email. Please try again.' }, 502)
  }
})
