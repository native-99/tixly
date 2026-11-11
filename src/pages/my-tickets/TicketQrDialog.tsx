import { X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { formatDateTime } from '@/lib/format'
import type { TicketWithDetails } from '@/types'

interface TicketQrDialogProps {
  ticket: TicketWithDetails
  open: boolean
  onClose(): void
}

/**
 * Full-screen QR view for the gate. Phones dim and lock while waiting in line,
 * so opening this also asks for a wake lock where the browser supports it.
 */
export function TicketQrDialog({ ticket, open, onClose }: TicketQrDialogProps) {
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    let wakeLock: WakeLockSentinel | null = null
    let cancelled = false

    closeButton.current?.focus()
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      // Only two buttons here, but keep Tab inside the dialog all the same.
      const focusable = dialog.current?.querySelectorAll<HTMLElement>('button')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    if ('wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) void lock.release().catch(() => undefined)
          else wakeLock = lock
        })
        .catch(() => undefined)
    }

    return () => {
      cancelled = true
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (wakeLock) void wakeLock.release().catch(() => undefined)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-qr-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/75 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={dialog} className="w-full max-w-sm rounded-3xl border border-white/20 bg-white p-5 shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p id="ticket-qr-title" className="truncate text-base font-extrabold tracking-tight text-ink-900">
              {ticket.event.title}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-ink-500">
              {ticket.ticketTypeName} · {formatDateTime(ticket.event.startsAt)}
            </p>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close QR code"
            className="grid size-10 shrink-0 place-items-center rounded-2xl text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-4 rounded-3xl border-2 border-dashed border-ink-200/80 p-4">
          <QRCodeSVG
            value={ticket.code}
            size={320}
            level="M"
            className="h-auto w-full"
            title={`QR code for ticket ${ticket.code}`}
          />
        </div>

        <p className="mt-4 text-center font-mono text-base tracking-widest text-ink-800">
          {ticket.code}
        </p>
        <p className="mt-2 text-center text-xs text-ink-500">
          Turn up your brightness and show this at the gate. Works without internet.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  )
}
