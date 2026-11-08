import { Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { EventCover } from '@/components/events/EventCover'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'
import type { EventSummary } from '@/types'

export function OrganizerEventCard({ event }: { event: EventSummary }) {
  // "Taken" includes paid tickets and tickets currently on hold at checkout.
  const taken = event.capacity - event.remaining
  const percent = event.capacity === 0 ? 0 : Math.round((taken / event.capacity) * 100)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <EventCover event={event} className="size-16 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={paths.eventDetail(event.id)} className="line-clamp-2 font-semibold text-slate-900">
              {event.title}
            </Link>
            {event.status === 'published' ? <Badge tone="success">Live</Badge> : <Badge>Draft</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{formatDateTime(event.startsAt)}</p>
          <p className="text-sm text-slate-500">{event.city}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-900">{taken}</span> / {event.capacity} tickets taken
          </span>
          <span>{percent}%</span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${event.title} tickets taken`}
        >
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <Link
        to={paths.editEvent(event.id)}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        <Pencil className="size-4" aria-hidden />
        Edit event
      </Link>
    </article>
  )
}
