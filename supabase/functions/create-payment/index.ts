// Creates a Midtrans Snap payment for one order.
//
// Called from the browser with the buyer's JWT. The server key never leaves
// this function. When MIDTRANS_SERVER_KEY is unset the app falls back to the
// simulated checkout, which keeps the demo working without credentials.

import { appUrl, handleOptions, json, serviceClient, userClient } from '../_shared/http.ts'

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
// The gateway is opt-in: a key alone is not enough, so a local test key can't
// accidentally send the demo checkout to the real Midtrans API.
const MIDTRANS_ENABLED =
  Deno.env.get('MIDTRANS_ENABLED') === 'true' && MIDTRANS_SERVER_KEY.length > 0
const MIDTRANS_IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'

Deno.serve(async (request) => {
  const preflight = handleOptions(request)
  if (preflight) return preflight

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'Missing Authorization header' }, 401)

  let orderId: string
  try {
    const body = await request.json()
    orderId = String(body?.orderId ?? '')
  } catch {
    return json({ error: 'Expected a JSON body with { orderId }' }, 400)
  }
  if (!orderId) return json({ error: 'orderId is required' }, 400)

  // Read the order as the caller: `get_order` only returns the buyer's own.
  const asUser = userClient(authorization)
  const { data: order, error: orderError } = await asUser.rpc('get_order', { p_order_id: orderId })
  if (orderError) return json({ error: orderError.message }, 400)
  if (!order) return json({ error: 'Order not found' }, 404)

  if (order.status === 'paid') return json({ error: 'Order is already paid', status: 'paid' }, 409)
  if (order.status !== 'pending') {
    return json({ error: 'This order can no longer be paid', status: order.status }, 409)
  }

  // Demo mode: no credentials, let the client use the simulated payment.
  if (!MIDTRANS_ENABLED) {
    return json({ simulated: true, redirectUrl: null })
  }

  const admin = serviceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', order.buyerId)
    .single()

  const ticketTypeIds = (order.items ?? []).map((item: { ticketTypeId: string }) => item.ticketTypeId)
  const { data: ticketTypes } = await admin
    .from('ticket_types')
    .select('id, name')
    .in('id', ticketTypeIds)
  const nameById = new Map((ticketTypes ?? []).map((row) => [row.id, row.name]))

  // Midtrans caps order_id at 50 characters: uuid (36) + "-" + 10 digits = 47.
  const midtransOrderId = `${order.id}-${Math.floor(Date.now() / 1000)}`

  const payload = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: order.total,
    },
    item_details: (order.items ?? []).map(
      (item: { ticketTypeId: string; quantity: number; unitPrice: number }) => ({
        id: item.ticketTypeId,
        name: nameById.get(item.ticketTypeId) ?? 'Ticket',
        price: item.unitPrice,
        quantity: item.quantity,
      }),
    ),
    customer_details: {
      first_name: profile?.full_name?.split(/\s+/)[0] ?? 'Buyer',
      email: profile?.email ?? undefined,
    },
    callbacks: {
      finish: `${appUrl()}/checkout/${order.id}?paid=1`,
    },
    // The hold is 10 minutes; the Snap session expires with it.
    expiry: { unit: 'minutes', duration: 10 },
  }

  const base = MIDTRANS_IS_PRODUCTION
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com'

  const response = await fetch(`${base}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${btoa(`${MIDTRANS_SERVER_KEY}:`)}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('Midtrans rejected the transaction', response.status, detail)
    return json({ error: 'Could not start the payment. Please try again.' }, 502)
  }

  const snap = await response.json() as { token: string; redirect_url: string }

  // Store the reference so the webhook can match the notification back.
  const { error: updateError } = await admin
    .from('orders')
    .update({
      payment_provider: 'midtrans',
      payment_ref: midtransOrderId,
      payment_url: snap.redirect_url,
    })
    .eq('id', order.id)
  if (updateError) {
    console.error('Could not store the payment reference', updateError.message)
    return json({ error: 'Could not start the payment. Please try again.' }, 500)
  }

  return json({ simulated: false, token: snap.token, redirectUrl: snap.redirect_url })
})
