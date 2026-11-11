// Ticket email rendering + delivery.
//
// Local: Mailpit's HTTP API (no SMTP credentials needed, mail shows up at
// http://127.0.0.1:54324).
// Production: SMTP, using the same host/user/password you configure for
// Supabase Auth. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.

import { appUrl, fromAddress } from './http.ts'

export interface TicketEmailPayload {
  orderId: string
  buyerName: string
  buyerEmail: string
  emailedAt: string | null
  event: {
    id: string
    title: string
    venue: string
    city: string
    startsAt: string
  }
  tickets: Array<{ code: string; ticketTypeName: string }>
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
})

export function renderTicketEmail(payload: TicketEmailPayload): { subject: string; html: string; text: string } {
  const firstName = payload.buyerName.trim().split(/\s+/)[0] || 'there'
  const when = dateFormatter.format(new Date(payload.event.startsAt))
  const ticketsUrl = `${appUrl()}/my-tickets`
  const subject = `Your tickets for ${payload.event.title}`

  const rows = payload.tickets
    .map(
      (ticket, index) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e8e9f2;">
          <div style="font:600 13px/1.4 Arial,sans-serif;color:#5b5f7b;">Ticket ${index + 1} · ${escapeHtml(ticket.ticketTypeName)}</div>
          <div style="font:700 18px/1.5 'Courier New',monospace;letter-spacing:1px;color:#111827;">${escapeHtml(ticket.code)}</div>
        </td>
      </tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px 12px;background:#f3f4fa;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:28px 28px 20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;">
          <div style="font:700 13px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;opacity:.8;">Tixly</div>
          <h1 style="margin:10px 0 0;font:800 24px/1.3 Arial,sans-serif;">You're going!</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 16px;font:400 15px/1.6 Arial,sans-serif;color:#374151;">
            Hi ${escapeHtml(firstName)}, your payment went through. Here are your tickets.
          </p>

          <div style="padding:16px;border-radius:14px;background:#f8f9ff;border:1px solid #e8e9f2;">
            <div style="font:800 17px/1.4 Arial,sans-serif;color:#111827;">${escapeHtml(payload.event.title)}</div>
            <div style="margin-top:4px;font:400 14px/1.5 Arial,sans-serif;color:#5b5f7b;">${escapeHtml(when)}</div>
            <div style="font:400 14px/1.5 Arial,sans-serif;color:#5b5f7b;">${escapeHtml(payload.event.venue)}, ${escapeHtml(payload.event.city)}</div>
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
            ${rows}
          </table>

          <p style="margin:18px 0 0;font:400 14px/1.6 Arial,sans-serif;color:#5b5f7b;">
            Open the app to show the QR code at the gate, or give the code above to gate staff.
          </p>

          <a href="${ticketsUrl}" style="display:inline-block;margin-top:20px;padding:13px 22px;border-radius:12px;background:#4f46e5;color:#ffffff;font:700 15px/1 Arial,sans-serif;text-decoration:none;">
            Open my tickets
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px 26px;font:400 12px/1.6 Arial,sans-serif;color:#9aa0b4;">
          Order ${escapeHtml(payload.orderId)} · Each ticket works once.
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    `Hi ${firstName}, your payment went through.`,
    '',
    payload.event.title,
    when,
    `${payload.event.venue}, ${payload.event.city}`,
    '',
    ...payload.tickets.map(
      (ticket, index) => `Ticket ${index + 1} (${ticket.ticketTypeName}): ${ticket.code}`,
    ),
    '',
    `Open your tickets: ${ticketsUrl}`,
  ].join('\n')

  return { subject, html, text }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function sendWithMailpit(
  mailpitUrl: string,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const response = await fetch(`${mailpitUrl.replace(/\/+$/, '')}/api/v1/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      From: fromAddress(),
      To: [{ Email: to }],
      Subject: subject,
      HTML: html,
      Text: text,
    }),
  })
  if (!response.ok) {
    throw new Error(`Mailpit rejected the message (${response.status}): ${await response.text()}`)
  }
}

async function sendWithSmtp(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const { default: nodemailer } = await import('npm:nodemailer@6.9.16')
  const host = Deno.env.get('SMTP_HOST')!
  const port = Number(Deno.env.get('SMTP_PORT') ?? '587')
  const user = Deno.env.get('SMTP_USER')
  const pass = Deno.env.get('SMTP_PASS')

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  })

  await transport.sendMail({
    from: fromAddress(),
    to,
    subject,
    html,
    text,
  })
}

/** Sends the ticket email and reports which transport was used. */
export async function sendTicketEmail(payload: TicketEmailPayload): Promise<'smtp' | 'mailpit'> {
  const { subject, html, text } = renderTicketEmail(payload)

  if (Deno.env.get('SMTP_HOST')) {
    await sendWithSmtp(payload.buyerEmail, subject, html, text)
    return 'smtp'
  }

  // Inside the Edge runtime container, `inbucket` is Mailpit's docker alias.
  const mailpit = Deno.env.get('MAILPIT_URL') ?? 'http://inbucket:8025'
  // Local development: if Mailpit isn't reachable, fail loudly so the webhook
  // retry (or the log) makes it obvious instead of silently dropping the mail.
  await sendWithMailpit(mailpit, payload.buyerEmail, subject, html, text)
  return 'mailpit'
}
