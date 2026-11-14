import { Ticket } from 'lucide-react'
import { categoryMeta } from '@/config/categories'
import { cn } from '@/lib/cn'
import type { Event } from '@/types'

interface EventCoverProps {
  event: Pick<Event, 'title' | 'posterUrl' | 'category'>
  className?: string
}

/**
 * Poster when the organizer uploaded one, otherwise a category-coloured
 * illustration. The category keeps placeholder covers distinguishable
 * instead of six near-identical gradients.
 */
export function EventCover({ event, className }: EventCoverProps) {
  if (event.posterUrl) {
    return (
      <img
        src={event.posterUrl}
        alt={`${event.title} poster`}
        className={cn('object-cover', className)}
        loading="lazy"
      />
    )
  }

  const { gradient, icon: CategoryIcon } = categoryMeta[event.category]

  return (
    <div
      className={cn('relative overflow-hidden bg-linear-to-br', gradient, className)}
      aria-hidden
    >
      {/* Soft light blooms instead of a flat gradient. */}
      <div className="absolute -top-1/3 -right-1/4 size-2/3 rounded-full bg-white/30 blur-3xl" />
      <div className="absolute -bottom-1/3 -left-1/5 size-2/3 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_38%,rgba(255,255,255,0.22)_50%,transparent_62%)]" />
      <CategoryIcon className="absolute -right-5 -bottom-7 size-40 rotate-[-12deg] text-white/25" />
      <Ticket className="absolute top-5 right-14 size-9 rotate-12 text-white/15" />
    </div>
  )
}
