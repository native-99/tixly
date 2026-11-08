import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { queryKeys } from '@/lib/queryKeys'
import { services } from '@/services'
import { paths } from '@/routes/paths'
import { CheckoutView } from './CheckoutView'

export default function CheckoutPage() {
  const { orderId = '' } = useParams()

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => services.orders.getById(orderId),
  })
  const eventId = orderQuery.data?.eventId
  const eventQuery = useQuery({
    queryKey: queryKeys.event(eventId ?? ''),
    queryFn: () => services.events.getById(eventId ?? ''),
    enabled: Boolean(eventId),
  })

  if (orderQuery.isPending || (eventId && eventQuery.isPending)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (orderQuery.isError) {
    return <ErrorState error={orderQuery.error} onRetry={() => orderQuery.refetch()} />
  }
  if (eventQuery.isError) {
    return <ErrorState error={eventQuery.error} onRetry={() => eventQuery.refetch()} />
  }
  if (!orderQuery.data || !eventQuery.data) {
    return (
      <>
        <PageHeader title="Checkout" />
        <EmptyState
          title="Order not found"
          action={
            <Link to={paths.events} className="font-semibold text-brand-600">
              Browse events
            </Link>
          }
        />
      </>
    )
  }

  return <CheckoutView order={orderQuery.data} event={eventQuery.data} />
}
