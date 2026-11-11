import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { queryKeys } from '@/lib/queryKeys'
import { services } from '@/services'
import { paths } from '@/routes/paths'
import { EventForm } from './EventForm'
import { emptyValues, valuesFromEvent } from './formModel'

export default function EventFormPage() {
  const { eventId } = useParams()

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        to={paths.organizerEvents}
        className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-500"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My events
      </Link>
      {eventId ? <EditEvent eventId={eventId} /> : <CreateEvent />}
    </div>
  )
}

function CreateEvent() {
  return (
    <>
      <PageHeader title="New event" description="Fill in the details, add tickets, then publish." />
      <EventForm initialValues={emptyValues()} />
    </>
  )
}

function EditEvent({ eventId }: { eventId: string }) {
  const { user } = useAuth()
  const eventQuery = useQuery({
    queryKey: queryKeys.event(eventId),
    queryFn: () => services.events.getById(eventId),
  })

  if (eventQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }
  if (eventQuery.isError) {
    return <ErrorState error={eventQuery.error} onRetry={() => eventQuery.refetch()} />
  }
  // Treat someone else's event the same as a missing one.
  if (!eventQuery.data || eventQuery.data.organizerId !== user?.id) {
    return <EmptyState title="Event not found" description="You can only edit your own events." />
  }

  return (
    <>
      <PageHeader title="Edit event" />
      {/* key: reset the form if we navigate between two events */}
      <EventForm key={eventId} eventId={eventId} initialValues={valuesFromEvent(eventQuery.data)} />
    </>
  )
}
