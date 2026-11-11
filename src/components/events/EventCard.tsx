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
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:scale-[0.99]"
    >
      <div className="relative overflow-hidden">
        <EventCover event={event} className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900/45 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 rounded-2xl bg-white/90 px-3 py-1.5 text-center leading-none shadow-soft backdrop-blur">
          <p className="text-lg font-extrabold text-ink-900">{day}</p>
          <p className="mt-0.5 text-[10px] font-bold tracking-wider text-brand-600 uppercase">{month}</p>
        </div>
        <div className="absolute top-3 right-3">
          <AvailabilityBadge remaining={event.remaining} />
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
          {categoryLabel(event.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="line-clamp-2 text-[17px] font-bold tracking-tight text-ink-900 transition-colors group-hover:text-brand-700">
          {event.title}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-ink-500">{formatDateTime(event.startsAt)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
        </p>
        <p className="mt-auto pt-4 text-sm text-ink-500">
          {event.minPrice === null ? (
            'Tickets coming soon'
          ) : (
            <>
              From{' '}
              <span className="bg-linear-to-r from-brand-600 to-violet-600 bg-clip-text font-bold text-transparent">
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
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-soft">
      <div className="aspect-[16/9] w-full animate-pulse bg-ink-200/70" />
      <div className="space-y-2 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-ink-200/70" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-ink-200/70" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-ink-200/70" />
      </div>
    </div>
  )
}
