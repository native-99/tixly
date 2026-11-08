import { Ticket } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Event } from '@/types'

// Placeholder covers until organizers upload posters (Supabase Storage stage).
const gradients = [
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-sky-400 via-blue-500 to-indigo-600',
  'from-fuchsia-500 via-rose-500 to-orange-400',
  'from-slate-700 via-slate-800 to-indigo-900',
]

function pickGradient(seed: string): string {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return gradients[hash % gradients.length]
}

interface EventCoverProps {
  event: Pick<Event, 'id' | 'title' | 'posterUrl'>
  className?: string
}

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

  return (
    <div
      className={cn('relative overflow-hidden bg-gradient-to-br', pickGradient(event.id), className)}
      aria-hidden
    >
      <Ticket className="absolute -right-4 -bottom-6 size-28 rotate-[-18deg] text-white/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
    </div>
  )
}
