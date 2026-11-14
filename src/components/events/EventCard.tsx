import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { categoryLabel } from '@/config/categories'
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
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/90 shadow-soft ring-1 ring-ink-900/5 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lift active:scale-[0.99]"
    >
      <div className="relative overflow-hidden">
        <EventCover
          event={event}
          className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink-950/55 via-ink-950/5 to-transparent" />

        <div className="absolute top-3 left-3 rounded-2xl bg-white/85 px-3 py-1.5 text-center leading-none shadow-soft ring-1 ring-white/40 backdrop-blur-xl">
          <p className="text-lg font-extrabold tracking-tight text-ink-900">{day}</p>
          <p className="mt-0.5 text-[10px] font-bold tracking-wider text-brand-600 uppercase">{month}</p>
        </div>
        <div className="absolute top-3 right-3">
          <AvailabilityBadge remaining={event.remaining} />
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink-950/45 px-3 py-1 text-[11px] font-semibold tracking-wide text-white ring-1 ring-white/15 backdrop-blur-md">
          {categoryLabel(event.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="line-clamp-2 text-[17px] font-bold tracking-[-0.02em] text-ink-900 transition-colors group-hover:text-brand-700">
          {event.title}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-ink-500">{formatDateTime(event.startsAt)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
        </p>
        <p className="mt-auto flex items-baseline gap-1.5 pt-4 text-sm text-ink-500">
          {event.minPrice === null ? (
            'Tickets coming soon'
          ) : (
            <>
              <span>From</span>
              <span className="text-base font-extrabold tracking-[-0.02em] text-ink-900">
                {formatRupiah(event.minPrice)}
              </span>
            </>
          )}
        </p>
      </div>
    </Link>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white/90 shadow-soft ring-1 ring-ink-900/5">
      <div className="skeleton animate-shimmer aspect-[16/9] w-full rounded-none" />
      <div className="space-y-2.5 p-5">
        <div className="skeleton animate-shimmer h-4 w-3/4" />
        <div className="skeleton animate-shimmer h-3 w-1/2" />
        <div className="skeleton animate-shimmer h-3 w-2/3" />
      </div>
    </div>
  )
}
