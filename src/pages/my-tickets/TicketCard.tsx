import { CalendarDays, MapPin } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/format'
import type { TicketWithDetails } from '@/types'

export function TicketCard({ ticket }: { ticket: TicketWithDetails }) {
  const isUsed = ticket.status === 'checked_in'

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">
              {ticket.ticketTypeName}
            </p>
            <h2 className="mt-0.5 line-clamp-2 font-semibold text-slate-900">{ticket.event.title}</h2>
          </div>
          {isUsed ? <Badge>Checked in</Badge> : <Badge tone="success">Ready</Badge>}
        </div>
        <ul className="mt-2 space-y-1 text-sm text-slate-500">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatDateTime(ticket.event.startsAt)}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {ticket.event.venue}, {ticket.event.city}
            </span>
          </li>
        </ul>
      </div>

      {/* Tear line with side notches, like a paper ticket */}
      <div className="relative h-0 border-t-2 border-dashed border-slate-200">
        <span className="absolute -top-3 -left-3 size-6 rounded-full bg-slate-50" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full bg-slate-50" />
      </div>

      <div className="flex flex-col items-center p-5">
        <div className={isUsed ? 'rounded-xl bg-white p-2 opacity-30' : 'rounded-xl bg-white p-2'}>
          <QRCodeSVG value={ticket.code} size={168} level="M" title={`QR code for ticket ${ticket.code}`} />
        </div>
        <p className="mt-3 font-mono text-sm tracking-wider text-slate-700">{ticket.code}</p>
        <p className="mt-1 text-xs text-slate-500">
          {isUsed ? 'This ticket has been used.' : 'Show this QR code at the entrance.'}
        </p>
      </div>
    </article>
  )
}
