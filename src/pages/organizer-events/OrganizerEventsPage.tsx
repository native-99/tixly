import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { queryKeys } from '@/lib/queryKeys'
import { services } from '@/services'
import { paths } from '@/routes/paths'
import { OrganizerEventCard } from './OrganizerEventCard'

export default function OrganizerEventsPage() {
  const eventsQuery = useQuery({
    queryKey: queryKeys.myEvents,
    queryFn: () => services.events.listMine(),
  })

  const newEventLink = (
    <Link
      to={paths.newEvent}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"
    >
      <Plus className="size-4" aria-hidden />
      New
    </Link>
  )

  return (
    <>
      <PageHeader title="My events" description="Manage events and track sales." action={newEventLink} />

      {eventsQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : eventsQuery.isError ? (
        <ErrorState error={eventsQuery.error} onRetry={() => eventsQuery.refetch()} />
      ) : eventsQuery.data.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to start selling tickets."
          action={newEventLink}
        />
      ) : (
        <ul className="space-y-4">
          {eventsQuery.data.map((event) => (
            <li key={event.id}>
              <OrganizerEventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
