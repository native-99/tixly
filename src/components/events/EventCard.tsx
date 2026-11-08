import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { dateParts, formatDateTime, formatRupiah } from '@/lib/format'
import { paths } from '@/routes/paths'
import type { EventSummary } from '@/types'
import { AvailabilityBadge } from './AvailabilityBadge'
import { EventCover } from './EventCover'

export function EventCard({ event }: { event: EventSummary }) {
  const { day, month } = dateParts(event.startsAt)

  return (
    <Link
      to={paths.eventDetail(event.id)}
      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.99]"
    >
      <div className="relative">
        <EventCover event={event} className="aspect-[16/8] w-full" />
        <div className="absolute top-3 left-3 rounded-xl bg-white/95 px-2.5 py-1 text-center leading-none shadow">
          <p className="text-lg font-bold text-slate-900">{day}</p>
          <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-brand-600">{month}</p>
        </div>
        <div className="absolute top-3 right-3">
          <AvailabilityBadge remaining={event.remaining} />
        </div>
      </div>

      <div className="p-4">
        <h2 className="line-clamp-2 font-semibold text-slate-900">{event.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{formatDateTime(event.startsAt)}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {event.minPrice === null ? (
            'Tickets coming soon'
          ) : (
            <>
              From <span className="font-semibold text-slate-900">{formatRupiah(event.minPrice)}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-[16/8] w-full animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  )
}
