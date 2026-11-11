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
import { categoryLabel } from '@/config/categories'
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
          <Skeleton className="h-8 w-3/4 rounded-full" />
          <Skeleton className="h-4 w-1/2 rounded-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-3xl" />
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

  // Guests can browse the event; the login prompt only appears at checkout.
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
    <div className="pb-32 lg:pb-0">
      <Link
        to={paths.events}
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All events
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start lg:gap-10">
        <div>
          <div className="relative overflow-hidden rounded-3xl shadow-lift">
            <EventCover event={event} className="aspect-[16/9] w-full" />
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{categoryLabel(event.category)}</Badge>
              {event.status === 'draft' && <Badge>Draft</Badge>}
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
              {event.title}
            </h1>

            <ul className="mt-4 flex flex-wrap gap-2">
              <li className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-3.5 py-2 text-sm font-medium text-ink-700 shadow-soft backdrop-blur-sm">
                <CalendarDays className="size-4 text-brand-600" aria-hidden />
                {formatDateTime(event.startsAt)}
              </li>
              <li className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-3.5 py-2 text-sm font-medium text-ink-700 shadow-soft backdrop-blur-sm">
                <MapPin className="size-4 text-brand-600" aria-hidden />
                {event.venue}, {event.city}
              </li>
            </ul>

            <p className="mt-6 text-[15px] leading-relaxed text-ink-600">{event.description}</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-lift backdrop-blur-sm">
            <div className="bg-linear-to-r from-brand-600 to-violet-600 px-5 py-3.5 text-white">
              <h2 className="text-base font-bold">Tickets</h2>
            </div>
            {event.ticketTypes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-500">
                Tickets aren't on sale yet.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100 px-5">
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

            {canBuy && event.ticketTypes.length > 0 && (
              <div className="hidden border-t border-ink-100 px-5 py-4 lg:block">
                {totalQuantity > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ink-500">
                      {totalQuantity} ticket{totalQuantity === 1 ? '' : 's'}
                    </span>
                    <span className="text-xl font-extrabold tracking-tight text-ink-900">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>
                ) : (
                  <p className="text-center text-sm text-ink-500">Choose a ticket type to continue.</p>
                )}
                <Button
                  fullWidth
                  className="mt-3"
                  onClick={handleCheckout}
                  isLoading={checkoutMutation.isPending}
                  disabled={totalQuantity === 0}
                >
                  {user ? 'Checkout' : 'Log in to buy'}
                </Button>
              </div>
            )}
          </section>

          {!canBuy && (
            <p className="mt-4 text-center text-sm text-ink-500">
              Only buyer accounts can purchase tickets.
            </p>
          )}
          {user === null && canBuy && (
            <p className="mt-4 text-center text-sm text-ink-500">
              Browse freely — you'll be asked to log in when you check out.
            </p>
          )}

          {checkoutMutation.isError && (
            <div className="mt-4">
              <ErrorAlert>{getErrorMessage(checkoutMutation.error)}</ErrorAlert>
            </div>
          )}
        </aside>
      </div>

      {canBuy && totalQuantity > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-3xl border border-white/60 bg-white/85 px-4 py-3 shadow-pill backdrop-blur-xl">
            <div>
              <p className="text-xs font-medium text-ink-500">
                {totalQuantity} ticket{totalQuantity > 1 ? 's' : ''}
              </p>
              <p className="text-lg font-extrabold tracking-tight text-ink-900">
                {formatRupiah(totalPrice)}
              </p>
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
