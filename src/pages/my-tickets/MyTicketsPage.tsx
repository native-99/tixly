import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { queryKeys } from '@/lib/queryKeys'
import { services } from '@/services'
import { paths } from '@/routes/paths'
import { TicketCard } from './TicketCard'

export default function MyTicketsPage() {
  const ticketsQuery = useQuery({
    queryKey: queryKeys.myTickets,
    queryFn: () => services.tickets.listMine(),
  })

  return (
    <>
      <PageHeader title="My tickets" description="Your QR codes for entry." />

      {ticketsQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : ticketsQuery.isError ? (
        <ErrorState error={ticketsQuery.error} onRetry={() => ticketsQuery.refetch()} />
      ) : ticketsQuery.data.length === 0 ? (
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
        <ul className="space-y-4">
          {ticketsQuery.data.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
