import { Maximize2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useState } from 'react'
import { formatDateTime } from '@/lib/format'
import type { TicketWithDetails } from '@/types'
import { TicketQrDialog } from './TicketQrDialog'

interface TicketCardProps {
  ticket: TicketWithDetails
  /** Position within this event's ticket group, starting at 1. */
  position: number
  total: number
}

export function TicketCard({ ticket, position, total }: TicketCardProps) {
  const isUsed = ticket.status === 'checked_in'
  const [qrOpen, setQrOpen] = useState(false)
  const closeQr = useCallback(() => setQrOpen(false), [])

  return (
    <article className="overflow-hidden rounded-3xl bg-white/90 shadow-soft ring-1 ring-ink-900/5 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lift">
      <div className="relative overflow-hidden bg-linear-to-br from-brand-500 via-brand-600 to-violet-600 px-5 py-4 text-white">
        <div className="absolute -top-10 -right-6 size-32 rounded-full bg-white/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-widest uppercase opacity-80">
              {ticket.ticketTypeName}
            </p>
            <p className="mt-1 truncate text-base font-extrabold tracking-[-0.02em]">{ticket.event.title}</p>
            <p className="mt-0.5 text-xs font-medium opacity-80">
              {formatDateTime(ticket.event.startsAt)} · {ticket.event.venue}, {ticket.event.city}
            </p>
          </div>
          {isUsed ? (
            <span className="shrink-0 rounded-full bg-ink-950/25 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20 ring-inset">
              Used
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/25 ring-inset backdrop-blur">
              Valid
            </span>
          )}
        </div>
        <p className="relative mt-3 text-[11px] font-semibold tracking-wide opacity-75 uppercase">
          Ticket {position} of {total}
        </p>
      </div>

      {/* Perforated seam between the ticket header and the code */}
      <div className="relative h-px bg-ink-200/60">
        <div className="absolute inset-x-6 -top-1 border-t-2 border-dashed border-ink-200/80" />
      </div>

      <div className="flex flex-col items-center p-6">
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          aria-label={`Enlarge QR code for ticket ${ticket.code}`}
          className={`cursor-zoom-in rounded-3xl bg-ink-50/80 p-4 ring-1 transition-all duration-200 hover:bg-white hover:ring-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
            isUsed ? 'ring-ink-200/70 opacity-40' : 'ring-ink-900/5'
          }`}
        >
          <QRCodeSVG value={ticket.code} size={176} level="M" title={`QR code for ticket ${ticket.code}`} />
        </button>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
          <Maximize2 className="size-3.5" aria-hidden />
          Tap the QR code to enlarge
        </p>
        <p className="mt-3 rounded-full bg-ink-900/5 px-4 py-1.5 font-mono text-sm tracking-widest text-ink-700">
          {ticket.code}
        </p>
        <p className="mt-3 text-center text-xs text-ink-500">
          {isUsed ? 'This ticket has been used.' : 'Show this QR code at the entrance.'}
        </p>
      </div>

      <TicketQrDialog ticket={ticket} open={qrOpen} onClose={closeQr} />
    </article>
  )
}
