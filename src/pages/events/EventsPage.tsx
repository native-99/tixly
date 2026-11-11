import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { categoryMeta, eventCategories } from '@/config/categories'
import { queryKeys } from '@/lib/queryKeys'
import { services } from '@/services'
import { defaultEventFilters, filterEvents, hasActiveFilters, type EventFilters } from './eventFilters'

export default function EventsPage() {
  const eventsQuery = useQuery({
    queryKey: queryKeys.publishedEvents,
    queryFn: () => services.events.listPublished(),
  })
  const [filters, setFilters] = useState<EventFilters>(defaultEventFilters)

  const events = eventsQuery.data
  const cities = useMemo(
    () => [...new Set((events ?? []).map((event) => event.city))].sort((a, b) => a.localeCompare(b)),
    [events],
  )
  const filtered = useMemo(() => filterEvents(events ?? [], filters), [events, filters])
  const isFiltering = hasActiveFilters(filters)

  function update<K extends keyof EventFilters>(field: K, value: EventFilters[K]) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function clearFilters() {
    setFilters(defaultEventFilters)
  }

  return (
    <>
      <PageHeader title="Upcoming events" description="Concerts, comedy, meetups and more." />

      <div className="mb-6 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-soft backdrop-blur-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,170px)_minmax(0,170px)_minmax(0,170px)_auto]">
          <label className="relative block sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search events</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => update('query', event.target.value)}
              placeholder="Search events, venues, cities…"
              className="block min-h-12 w-full rounded-2xl border border-ink-200 bg-white/90 pr-4 pl-11 text-base text-ink-900 shadow-sm transition-all placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/12 focus:outline-none"
            />
          </label>

          <FilterSelect
            label="City"
            value={filters.city}
            onChange={(value) => update('city', value)}
            options={[
              { value: 'all', label: 'All cities' },
              ...cities.map((city) => ({ value: city, label: city })),
            ]}
          />

          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={(value) => update('category', value as EventFilters['category'])}
            options={[
              { value: 'all', label: 'All categories' },
              ...eventCategories.map((category) => ({
                value: category,
                label: categoryMeta[category].label,
              })),
            ]}
          />

          <FilterSelect
            label="Date"
            value={filters.date}
            onChange={(value) => update('date', value as EventFilters['date'])}
            options={[
              { value: 'any', label: 'Any date' },
              { value: 'week', label: 'Next 7 days' },
              { value: 'month', label: 'Next 30 days' },
            ]}
          />

          {isFiltering && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-semibold text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
            >
              <X className="size-4" aria-hidden />
              Clear
            </button>
          )}
        </div>
      </div>

      {eventsQuery.isPending ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <EventCardSkeleton />
            </li>
          ))}
        </ul>
      ) : eventsQuery.isError ? (
        <ErrorState error={eventsQuery.error} onRetry={() => eventsQuery.refetch()} />
      ) : !events || events.length === 0 ? (
        <EmptyState title="No events yet" description="Check back soon for new events." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching events"
          description="Try a different city, category or date."
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold text-brand-600"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          {isFiltering && (
            <p className="mb-3 text-sm text-ink-500">
              {filtered.length} of {events.length} events
            </p>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange(value: string): void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block min-h-12 w-full rounded-2xl border border-ink-200 bg-white/90 px-4 text-base font-medium text-ink-700 shadow-sm transition-all focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/12 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
