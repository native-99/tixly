import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CheckInResult, CheckInStatus } from '@/types'

const config: Record<CheckInStatus, { title: string; icon: LucideIcon; classes: string }> = {
  valid: {
    title: 'Valid — checked in',
    icon: CircleCheck,
    classes: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  already_used: {
    title: 'Already used',
    icon: TriangleAlert,
    classes: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  invalid: {
    title: 'Invalid ticket',
    icon: CircleX,
    classes: 'border-red-300 bg-red-50 text-red-900',
  },
}

/** Compact one-line result shown over the camera view. */
export function ScanResultBanner({ status }: { status: CheckInStatus }) {
  const { title, icon: Icon, classes } = config[status]
  return (
    <div className={cn('flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 font-bold shadow-lift', classes)}>
      <Icon className="size-5 shrink-0" aria-hidden />
      {title}
    </div>
  )
}

export function ScanResultCard({ result, code }: { result: CheckInResult; code: string }) {
  const { title, icon: Icon, classes } = config[result.status]
  const ticket = result.ticket

  return (
    <div role="status" aria-live="assertive" className={cn('rounded-3xl border-2 p-5 shadow-soft', classes)}>
      <div className="flex items-center gap-3.5">
        <Icon className="size-9 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-lg font-extrabold tracking-tight">{title}</p>
          <p className="font-mono text-xs opacity-80">{code}</p>
        </div>
      </div>

      {ticket ? (
        <dl className="mt-3 space-y-1 border-t border-current/15 pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="opacity-75">Event</dt>
            <dd className="truncate text-right font-medium">{ticket.event.title}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="opacity-75">Ticket</dt>
            <dd className="font-medium">{ticket.ticketTypeName}</dd>
          </div>
          {ticket.checkedInAt && (
            <div className="flex justify-between gap-3">
              <dt className="opacity-75">{result.status === 'valid' ? 'Checked in at' : 'First used at'}</dt>
              <dd className="font-medium">{formatTime(ticket.checkedInAt)}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-3 border-t border-current/15 pt-3 text-sm">
          This code doesn't match any ticket for your events. Do not allow entry.
        </p>
      )}
    </div>
  )
}
