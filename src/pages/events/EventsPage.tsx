import { useQuery } from '@tanstack/react-query'
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { queryKeys } from '@/lib/queryKeys'
import { services } from '@/services'

export default function EventsPage() {
  const eventsQuery = useQuery({
    queryKey: queryKeys.publishedEvents,
    queryFn: () => services.events.listPublished(),
  })

  return (
    <>
      <PageHeader title="Upcoming events" description="Concerts, comedy, meetups and more." />

      {eventsQuery.isPending ? (
        <div className="space-y-4">
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : eventsQuery.isError ? (
        <ErrorState error={eventsQuery.error} onRetry={() => eventsQuery.refetch()} />
      ) : eventsQuery.data.length === 0 ? (
        <EmptyState title="No events yet" description="Check back soon for new events." />
      ) : (
        <ul className="space-y-4">
          {eventsQuery.data.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
