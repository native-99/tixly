// Midtrans payment notification handler.
//
// Signature check -> idempotent event log -> mark paid -> email tickets.
// Midtrans retries notifications, so every step must be safe to repeat.

import { json, serviceClient } from '../_shared/http.ts'
import { sendTicketEmail, type TicketEmailPayload } from '../_shared/email.ts'

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
const PROVIDER = 'midtrans'

interface Notification {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
  transaction_id: string
  transaction_status: string
  fraud_status?: string
  payment_type?: string
  transaction_time?: string
}

async function sha512Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Constant-time-ish comparison, so a wrong signature can't be brute forced. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!MIDTRANS_SERVER_KEY) {
    // Without the key the signature can't be verified, so refuse rather than
    // trust an unauthenticated caller.
    console.error('MIDTRANS_SERVER_KEY is not set; refusing notification')
    return json({ error: 'Payment gateway is not configured' }, 503)
  }

  let notification: Notification
  try {
    notification = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const {
    order_id: gatewayOrderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signature,
    transaction_id: transactionId,
    transaction_status: transactionStatus,
    fraud_status: fraudStatus,
  } = notification

  if (!gatewayOrderId || !transactionId || !transactionStatus || !signature) {
    return json({ error: 'Incomplete notification' }, 400)
  }

  const expected = await sha512Hex(`${gatewayOrderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
  if (!safeEqual(expected, String(signature))) {
    console.warn('Rejected notification with a bad signature', gatewayOrderId)
    return json({ error: 'Invalid signature' }, 401)
  }

  const admin = serviceClient()

  const { data: orderId, error: lookupError } = await admin.rpc('order_id_for_payment', {
    p_provider: PROVIDER,
    p_ref: gatewayOrderId,
  })
  if (lookupError) {
    console.error('Could not resolve the order', lookupError.message)
    return json({ error: 'Lookup failed' }, 500)
  }
  if (!orderId) {
    // Nothing to update; acknowledge so Midtrans stops retrying.
    console.warn('Notification for an unknown order', gatewayOrderId)
    return json({ received: true, matched: false })
  }

  // The status is part of the key: a later settlement is a new event, a retry
  // of the same settlement is ignored.
  const { data: isNew } = await admin.rpc('claim_payment_event', {
    p_provider: PROVIDER,
    p_external_id: `${transactionId}:${transactionStatus}`,
    p_order_id: orderId,
    p_status: transactionStatus,
    p_payload: notification,
  })

  if (!isNew) return json({ received: true, duplicate: true })

  const isPaid =
    (transactionStatus === 'settlement' || transactionStatus === 'capture') &&
    (fraudStatus === undefined || fraudStatus === 'accept')

  if (!isPaid) {
    return json({ received: true, status: transactionStatus })
  }

  const { data: result, error: markError } = await admin.rpc('mark_order_paid', {
    p_order_id: orderId,
    p_provider: PROVIDER,
    p_ref: gatewayOrderId,
    p_payload: notification,
  })
  if (markError) {
    console.error('Could not mark the order paid', markError.message)
    return json({ error: 'Could not mark the order paid' }, 500)
  }

  if (result?.status === 'late_payment') {
    console.warn('Payment arrived after the hold expired', orderId)
    return json({ received: true, late: true })
  }

  // Email failures must not make Midtrans retry a settled payment, so they are
  // logged and retried by the buyer from the checkout page instead.
  try {
    const { data: claimed } = await admin.rpc('claim_ticket_email', { p_order_id: orderId })
    if (claimed) {
      const { data: payload } = await admin.rpc('ticket_email_payload', { p_order_id: orderId })
      if (!payload) {
        await admin.rpc('release_ticket_email', { p_order_id: orderId })
      } else {
        await sendTicketEmail(payload as TicketEmailPayload)
        await admin
          .from('orders')
          .update({ tickets_emailed_at: new Date().toISOString() })
          .eq('id', orderId)
      }
    }
  } catch (error) {
    await admin.rpc('release_ticket_email', { p_order_id: orderId }).catch(() => undefined)
    console.error('Ticket email failed', error instanceof Error ? error.message : String(error))
  }

  return json({ received: true, paid: true })
})
