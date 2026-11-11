import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { useCachedList } from '@/lib/useCachedList'
import { services } from '@/services'
import { paths } from '@/routes/paths'
import type { TicketWithDetails } from '@/types'
import { TicketCard } from './TicketCard'

interface TicketGroup {
  event: TicketWithDetails['event']
  tickets: TicketWithDetails[]
}

/** One section per event, so two tickets for the same event are clearly a pair. */
function groupByEvent(tickets: TicketWithDetails[]): TicketGroup[] {
  const groups = new Map<string, TicketGroup>()

  for (const ticket of tickets) {
    const group = groups.get(ticket.eventId)
    if (group) group.tickets.push(ticket)
    else groups.set(ticket.eventId, { event: ticket.event, tickets: [ticket] })
  }

  return [...groups.values()].sort(
    (a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime(),
  )
}

export default function MyTicketsPage() {
  const ticketsQuery = useQuery({
    queryKey: queryKeys.myTickets,
    queryFn: () => services.tickets.listMine(),
  })
  const { items: tickets, usingCache } = useCachedList<TicketWithDetails>(
    'tickets',
    ticketsQuery.data,
    ticketsQuery.isError,
  )
  const groups = groupByEvent(tickets)

  return (
    <>
      <PageHeader title="My tickets" description="Your QR codes for entry." />

      <OfflineBanner usingCache={usingCache} cachedHint="your QR codes still work" />

      {ticketsQuery.isPending && tickets.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : ticketsQuery.isError && !usingCache ? (
        <ErrorState error={ticketsQuery.error} onRetry={() => ticketsQuery.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="Tickets you buy will show up here."
          action={
            <Link
              to={paths.events}
              className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"
            >
              Browse events
            </Link>
          }
        />
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.event.id}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                    {group.event.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    {formatDateTime(group.event.startsAt)} · {group.event.venue}, {group.event.city}
                  </p>
                </div>
                <Badge tone="brand">
                  {group.tickets.length} ticket{group.tickets.length === 1 ? '' : 's'}
                </Badge>
              </div>

              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.tickets.map((ticket, index) => (
                  <li key={ticket.id}>
                    <TicketCard ticket={ticket} position={index + 1} total={group.tickets.length} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
