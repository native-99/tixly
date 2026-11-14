import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Mail, MapPin, ReceiptText, Ticket } from 'lucide-react'
import { Link } from 'react-router'
import { EventCover } from '@/components/events/EventCover'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { useCachedList } from '@/lib/useCachedList'
import { services } from '@/services'
import { paths } from '@/routes/paths'
import type { OrderStatus, OrderSummary } from '@/types'

const statusMeta: Record<
  OrderStatus,
  { label: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Awaiting payment', tone: 'warning' },
  expired: { label: 'Expired', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export default function OrdersPage() {
  const ordersQuery = useQuery({
    queryKey: queryKeys.myOrders,
    queryFn: () => services.orders.listMine(),
  })
  const { items: orders, usingCache } = useCachedList<OrderSummary>(
    'orders',
    ordersQuery.data,
    ordersQuery.isError,
  )

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        eyebrow="Purchase history"
        title="Orders"
        description="Every ticket order, with its payment status."
      />

      <OfflineBanner usingCache={usingCache} cachedHint="payment status may be out of date" />

      {ordersQuery.isPending && orders.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      ) : ordersQuery.isError && !usingCache ? (
        <ErrorState error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you check out, your order and its tickets show up here."
          action={
            <Link to={paths.events} className={buttonClasses('primary')}>
              Browse events
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderCard({ order }: { order: OrderSummary }) {
  const meta = statusMeta[order.status]
  const isPaid = order.status === 'paid'

  return (
    <article className="overflow-hidden rounded-3xl bg-white/90 shadow-soft ring-1 ring-ink-900/5 backdrop-blur-xl">
      <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
        <EventCover
          event={order.event}
          className="size-16 shrink-0 rounded-2xl shadow-sm sm:size-24"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <span className="text-xs font-medium text-ink-400">
              Ordered {formatDate(order.createdAt)}
            </span>
          </div>
          <Link
            to={paths.eventDetail(order.eventId)}
            className="mt-1.5 line-clamp-2 text-base leading-snug font-extrabold tracking-tight text-ink-900 transition-colors hover:text-brand-700"
          >
            {order.event.title}
          </Link>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatDateTime(order.event.startsAt)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {order.event.venue}, {order.event.city}
          </p>
          {isPaid && order.ticketsEmailedAt && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              Tickets emailed
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-extrabold tracking-tight text-ink-900 tabular-nums">
            {formatRupiah(order.total)}
          </span>
          {isPaid && order.ticketCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-ink-500">
              <Ticket className="size-3.5" aria-hidden />
              {order.ticketCount} ticket{order.ticketCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isPaid ? (
            <Link to={paths.myTickets} className={buttonClasses('primary')}>
              <Ticket className="size-4" aria-hidden />
              View tickets
            </Link>
          ) : order.status === 'pending' ? (
            <Link to={paths.checkout(order.id)} className={buttonClasses('primary')}>
              <ReceiptText className="size-4" aria-hidden />
              Complete payment
            </Link>
          ) : null}
          <Link to={paths.eventDetail(order.eventId)} className={buttonClasses('secondary')}>
            View event
          </Link>
        </div>
      </div>
    </article>
  )
}
