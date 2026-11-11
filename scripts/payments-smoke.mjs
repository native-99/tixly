// End-to-end check of the payment plumbing, without a real Midtrans account:
//
//   1. create an order as the demo buyer
//   2. create-payment falls back to the simulated mode (no gateway key)
//   3. send a correctly signed Midtrans notification -> order paid + tickets
//   4. replay the same notification -> no duplicate tickets
//   5. a notification with a bad signature is rejected
//   6. the ticket email landed in Mailpit
//
// Needs `supabase start` and `supabase functions serve` running.
// Usage: npm run test:payments

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

function readEnv(path) {
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index < 0) continue
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }
  return env
}

const appEnv = readEnv('.env.local')
const fnEnv = readEnv('supabase/functions/.env')

const SUPABASE_URL = appEnv.VITE_SUPABASE_URL
const ANON_KEY = appEnv.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY = appEnv.SUPABASE_SERVICE_ROLE_KEY
const SERVER_KEY = fnEnv.MIDTRANS_SERVER_KEY
// The Edge runtime uses the docker alias; this script runs on the host.
const MAILPIT_URL = process.env.MAILPIT_HOST_URL ?? 'http://127.0.0.1:54324'

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Missing Supabase env vars. Copy .env.example to .env.local first.')
  process.exit(1)
}
if (!SERVER_KEY) {
  console.error('Missing MIDTRANS_SERVER_KEY in supabase/functions/.env (any value works locally).')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? '✔' : '✖'} ${name}${detail ? ` ${detail}` : ''}`)
  if (!ok) failures += 1
}

function sign(orderId, statusCode, grossAmount) {
  return createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`)
    .digest('hex')
}

async function main() {
  const buyer = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
  const { error: signInError } = await buyer.auth.signInWithPassword({
    email: 'buyer@tixly.dev',
    password: 'demo1234',
  })
  if (signInError) throw signInError

  const { data: events } = await admin
    .from('events')
    .select('id, title')
    .eq('status', 'published')
  if (!events?.length) throw new Error('No published event. Run npm run db:seed.')

  // 1. Order — try events until one still has quota.
  let order = null
  let event = null
  for (const candidate of events) {
    const { data: ticketTypes } = await admin
      .from('ticket_types')
      .select('id, price')
      .eq('event_id', candidate.id)
      .order('price', { ascending: true })

    for (const ticketType of ticketTypes ?? []) {
      const { data, error } = await buyer.rpc('create_order', {
        p_event_id: candidate.id,
        p_items: [{ ticketTypeId: ticketType.id, quantity: 1 }],
      })
      if (!error && data) {
        order = data
        event = candidate
        break
      }
    }
    if (order) break
  }
  if (!order) throw new Error('Could not reserve a ticket in any published event.')
  check('order created', order.status === 'pending', order.id)

  // 2. create-payment in demo mode
  const { data: session, error: sessionError } = await buyer.functions.invoke('create-payment', {
    body: { orderId: order.id },
  })
  check('create-payment falls back to simulated', sessionError === null && session?.simulated === true)

  // 3. Signed webhook
  const gatewayOrderId = `${order.id}-${Math.floor(Date.now() / 1000)}`
  const grossAmount = `${order.total}.00`
  const notification = {
    order_id: gatewayOrderId,
    status_code: '200',
    gross_amount: grossAmount,
    signature_key: sign(gatewayOrderId, '200', grossAmount),
    transaction_id: `txn-${order.id}`,
    transaction_status: 'settlement',
    fraud_status: 'accept',
    payment_type: 'qris',
  }

  const first = await fetch(`${SUPABASE_URL}/functions/v1/midtrans-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  })
  const firstBody = await first.json()
  check('webhook marks the order paid', first.ok && firstBody.paid === true, JSON.stringify(firstBody))

  const { data: paidOrder } = await admin
    .from('orders')
    .select('status, payment_provider, tickets_emailed_at')
    .eq('id', order.id)
    .single()
  check('order is paid by midtrans', paidOrder?.status === 'paid' && paidOrder?.payment_provider === 'midtrans')

  // The buyer's Orders page reads from list_my_orders.
  const { data: myOrders, error: myOrdersError } = await buyer.rpc('list_my_orders')
  const historyRow = (myOrders ?? []).find((row) => row.id === order.id)
  check('order history lists the order', myOrdersError === null && Boolean(historyRow))
  check(
    'order history carries the event details',
    historyRow?.event_title === event.title && Boolean(historyRow?.event_category),
  )

  const countTickets = async () => {
    const { count } = await admin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', order.id)
    return count ?? 0
  }
  const ticketsAfterFirst = await countTickets()
  check('one ticket issued', ticketsAfterFirst === 1, `count=${ticketsAfterFirst}`)

  const { data: ordersWithTickets } = await buyer.rpc('list_my_orders')
  const ticketCountRow = (ordersWithTickets ?? []).find((row) => row.id === order.id)
  check('order history counts the tickets', Number(ticketCountRow?.ticket_count) === 1)

  // 4. Replay
  const second = await fetch(`${SUPABASE_URL}/functions/v1/midtrans-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  })
  const secondBody = await second.json()
  check('replayed webhook is ignored', second.ok && secondBody.duplicate === true, JSON.stringify(secondBody))
  check('no duplicate ticket on replay', (await countTickets()) === ticketsAfterFirst)

  // 5. Bad signature
  const bad = await fetch(`${SUPABASE_URL}/functions/v1/midtrans-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...notification, signature_key: 'deadbeef' }),
  })
  check('bad signature is rejected', bad.status === 401, `status=${bad.status}`)

  // 6. Email
  const { data: emailedOrder } = await admin
    .from('orders')
    .select('tickets_emailed_at')
    .eq('id', order.id)
    .single()
  check('order records the email as sent', Boolean(emailedOrder?.tickets_emailed_at))

  // 7. The buyer-facing resend endpoint, called with the buyer's own JWT.
  const { data: alreadySent } = await buyer.functions.invoke('send-tickets', {
    body: { orderId: order.id },
  })
  check('send-tickets does not resend by default', alreadySent?.alreadySent === true)
  const { data: resent } = await buyer.functions.invoke('send-tickets', {
    body: { orderId: order.id, resend: true },
  })
  check('send-tickets can resend on request', resent?.sent === true, resent?.to ?? '')

  let emailFound = false
  let emailSubject = ''
  try {
    const response = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=20`)
    const inbox = await response.json()
    for (const message of inbox.messages ?? []) {
      if (message.Subject?.includes(event.title)) {
        emailFound = true
        emailSubject = message.Subject
        break
      }
    }
  } catch (error) {
    console.warn('Mailpit not reachable:', error.message)
  }
  check('ticket email reached Mailpit', emailFound, emailSubject)

  // Clean up this run, so repeated runs start from a clean state.
  await admin.from('payment_events').delete().eq('order_id', order.id)
  await admin.from('tickets').delete().eq('order_id', order.id)
  await admin.from('order_items').delete().eq('order_id', order.id)
  await admin.from('orders').delete().eq('id', order.id)

  console.log(failures === 0 ? '\nAll payment checks passed.' : `\n${failures} check(s) failed.`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
