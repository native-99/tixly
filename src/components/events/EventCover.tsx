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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.45),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:20px_20px] opacity-35" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-white/10 to-transparent" />
      <CategoryIcon className="absolute -right-4 -bottom-6 size-36 rotate-[-12deg] text-white/25" />
      <Ticket className="absolute top-4 right-16 size-11 rotate-12 text-white/15" />
    </div>
  )
}
