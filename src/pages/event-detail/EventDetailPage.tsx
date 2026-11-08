import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { EventCover } from '@/components/events/EventCover'
import { ErrorAlert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { getErrorMessage, services } from '@/services'
import { paths } from '@/routes/paths'
import type { EventDetail } from '@/types'
import { TicketTypeRow } from './TicketTypeRow'

export default function EventDetailPage() {
  const { eventId = '' } = useParams()
  const eventQuery = useQuery({
    queryKey: queryKeys.event(eventId),
    queryFn: () => services.events.getById(eventId),
  })

  if (eventQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  if (eventQuery.isError) {
    return <ErrorState error={eventQuery.error} onRetry={() => eventQuery.refetch()} />
  }
  if (!eventQuery.data) {
    return (
      <EmptyState
        title="Event not found"
        description="It may have been removed or isn't published yet."
        action={
          <Link to={paths.events} className="font-semibold text-brand-600">
            Browse events
          </Link>
        }
      />
    )
  }

  return <EventDetailView event={eventQuery.data} />
}

function EventDetailView({ event }: { event: EventDetail }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const canBuy = user === null || user.role === 'buyer'

  let totalQuantity = 0
  let totalPrice = 0
  for (const ticketType of event.ticketTypes) {
    const quantity = quantities[ticketType.id] ?? 0
    totalQuantity += quantity
    totalPrice += quantity * ticketType.price
  }

  const checkoutMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(quantities).map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
      }))
      return services.orders.createOrder(event.id, items)
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
      navigate(paths.checkout(order.id))
    },
    onError: () => {
      // Availability probably changed; show fresh numbers.
      queryClient.invalidateQueries({ queryKey: queryKeys.event(event.id) })
    },
  })

  function handleCheckout() {
    if (!user) {
      navigate(`${paths.login}?next=${encodeURIComponent(paths.eventDetail(event.id))}`)
      return
    }
    checkoutMutation.mutate()
  }

  return (
    <div className="pb-24">
      <Link
        to={paths.events}
        className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-slate-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All events
      </Link>

      <EventCover event={event} className="aspect-[16/9] w-full rounded-2xl" />

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
        {event.status === 'draft' && <Badge>Draft</Badge>}
      </div>

      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-brand-600" aria-hidden />
          {formatDateTime(event.startsAt)}
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-brand-600" aria-hidden />
          {event.venue}, {event.city}
        </li>
      </ul>

      <p className="mt-4 leading-relaxed text-slate-700">{event.description}</p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white px-4">
        <h2 className="border-b border-slate-100 py-3 font-semibold">Tickets</h2>
        {event.ticketTypes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Tickets aren't on sale yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {event.ticketTypes.map((ticketType) => (
              <TicketTypeRow
                key={ticketType.id}
                ticketType={ticketType}
                canSelect={canBuy}
                quantity={quantities[ticketType.id] ?? 0}
                onChange={(quantity) => setQuantities({ ...quantities, [ticketType.id]: quantity })}
              />
            ))}
          </ul>
        )}
      </section>

      {!canBuy && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Only buyer accounts can purchase tickets.
        </p>
      )}

      {checkoutMutation.isError && (
        <div className="mt-4">
          <ErrorAlert>{getErrorMessage(checkoutMutation.error)}</ErrorAlert>
        </div>
      )}

      {canBuy && totalQuantity > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">
                {totalQuantity} ticket{totalQuantity > 1 ? 's' : ''}
              </p>
              <p className="font-bold text-slate-900">{formatRupiah(totalPrice)}</p>
            </div>
            <Button onClick={handleCheckout} isLoading={checkoutMutation.isPending}>
              {user ? 'Checkout' : 'Log in to buy'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
