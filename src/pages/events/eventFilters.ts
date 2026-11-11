import { categoryLabel } from '@/config/categories'
import type { EventCategory, EventSummary } from '@/types'

export type DateRangeFilter = 'any' | 'week' | 'month'

export interface EventFilters {
  query: string
  /** City name, or 'all'. */
  city: string
  category: EventCategory | 'all'
  date: DateRangeFilter
}

export const defaultEventFilters: EventFilters = {
  query: '',
  city: 'all',
  category: 'all',
  date: 'any',
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Client-side filtering until the event list grows enough to need a query. */
export function filterEvents(
  events: EventSummary[],
  filters: EventFilters,
  now: Date = new Date(),
): EventSummary[] {
  const query = filters.query.trim().toLowerCase()
  const startsBefore =
    filters.date === 'week'
      ? now.getTime() + 7 * DAY_MS
      : filters.date === 'month'
        ? now.getTime() + 30 * DAY_MS
        : null

  return events.filter((event) => {
    if (filters.city !== 'all' && event.city !== filters.city) return false
    if (filters.category !== 'all' && event.category !== filters.category) return false

    if (startsBefore !== null) {
      const startsAt = new Date(event.startsAt).getTime()
      if (startsAt < now.getTime() || startsAt > startsBefore) return false
    }

    if (!query) return true
    const haystack = `${event.title} ${event.venue} ${event.city} ${categoryLabel(event.category)}`
    return haystack.toLowerCase().includes(query)
  })
}

export function hasActiveFilters(filters: EventFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.city !== 'all' ||
    filters.category !== 'all' ||
    filters.date !== 'any'
  )
}
