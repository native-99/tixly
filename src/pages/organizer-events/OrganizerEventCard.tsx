import { Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { EventCover } from '@/components/events/EventCover'
import { Badge } from '@/components/ui/Badge'
import { categoryLabel } from '@/config/categories'
import { formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'
import type { EventSummary } from '@/types'

export function OrganizerEventCard({ event }: { event: EventSummary }) {
  // "Taken" includes paid tickets and tickets currently on hold at checkout.
  const taken = event.capacity - event.remaining
  const percent = event.capacity === 0 ? 0 : Math.round((taken / event.capacity) * 100)

  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex gap-3.5">
        <EventCover event={event} className="size-20 shrink-0 rounded-2xl shadow-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={paths.eventDetail(event.id)}
              className="line-clamp-2 font-extrabold tracking-tight text-ink-900 transition-colors hover:text-brand-700"
            >
              {event.title}
            </Link>
            {event.status === 'published' ? <Badge tone="success">Live</Badge> : <Badge>Draft</Badge>}
          </div>
          <p className="mt-1 text-sm font-medium text-ink-500">{formatDateTime(event.startsAt)}</p>
          <p className="text-sm text-ink-500">
            {categoryLabel(event.category)} · {event.city}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-xs text-ink-500">
          <span>
            <span className="font-bold text-ink-900">{taken}</span> / {event.capacity} tickets taken
          </span>
          <span className="font-bold tabular-nums">{percent}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${event.title} tickets taken`}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-brand-500 to-violet-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <Link
        to={paths.editEvent(event.id)}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-ink-200/80 bg-white/80 text-sm font-semibold text-ink-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
      >
        <Pencil className="size-4" aria-hidden />
        Edit event
      </Link>
    </article>
  )
}
