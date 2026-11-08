import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, Clock, CreditCard } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { EventCover } from '@/components/events/EventCover'
import { PageHeader } from '@/components/PageHeader'
import { ErrorAlert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { formatCountdown, formatDateTime, formatRupiah } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { useCountdown } from '@/lib/useCountdown'
import { getErrorMessage, services } from '@/services'
import { paths } from '@/routes/paths'
import type { EventDetail, Order } from '@/types'

interface CheckoutViewProps {
  order: Order
  event: EventDetail
}

export function CheckoutView({ order, event }: CheckoutViewProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const msLeft = useCountdown(order.expiresAt)

  // The server decides the final status; the countdown hitting 0 is enough to
  // stop the buyer from paying in the UI.
  const isExpired = order.status === 'expired' || (order.status === 'pending' && msLeft === 0)

  const ticketTypeName = (ticketTypeId: string) =>
    event.ticketTypes.find((ticketType) => ticketType.id === ticketTypeId)?.name ?? 'Ticket'

  function refreshAfterChange() {
    queryClient.invalidateQueries({ queryKey: queryKeys.order(order.id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.events })
    queryClient.invalidateQueries({ queryKey: queryKeys.myTickets })
  }

  const payMutation = useMutation({
    mutationFn: () => services.orders.payOrder(order.id),
    onSuccess: () => {
      refreshAfterChange()
      navigate(paths.myTickets, { replace: true })
    },
    onError: refreshAfterChange,
  })

  const cancelMutation = useMutation({
    mutationFn: () => services.orders.cancelOrder(order.id),
    onSuccess: () => {
      refreshAfterChange()
      navigate(paths.eventDetail(event.id), { replace: true })
    },
  })

  const actionError = payMutation.error ?? cancelMutation.error
  const isBusy = payMutation.isPending || cancelMutation.isPending

  return (
    <>
      <PageHeader title="Checkout" />

      {order.status === 'pending' && !isExpired && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <Clock className="size-4 shrink-0" aria-hidden />
          <span>
            Tickets held for you for{' '}
            <span className="font-bold tabular-nums" role="timer">
              {formatCountdown(msLeft)}
            </span>
          </span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex gap-3 p-4">
          <EventCover event={event} className="size-16 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="line-clamp-2 font-semibold">{event.title}</p>
            <p className="mt-0.5 text-sm text-slate-500">{formatDateTime(event.startsAt)}</p>
            <p className="text-sm text-slate-500">
              {event.venue}, {event.city}
            </p>
          </div>
        </div>

        <ul className="divide-y divide-slate-100 border-t border-slate-100 px-4 text-sm">
          {order.items.map((item) => (
            <li key={item.ticketTypeId} className="flex justify-between gap-3 py-3">
              <span className="text-slate-700">
                {item.quantity} × {ticketTypeName(item.ticketTypeId)}
              </span>
              <span className="font-medium tabular-nums">{formatRupiah(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <span className="font-semibold">Total</span>
          <span className="font-bold tabular-nums">{formatRupiah(order.total)}</span>
        </div>
      </section>

      {actionError && (
        <div className="mt-4">
          <ErrorAlert>{getErrorMessage(actionError)}</ErrorAlert>
        </div>
      )}

      {order.status === 'paid' ? (
        <StatusBox tone="success" title="Payment complete" text="Your tickets are ready.">
          <Link to={paths.myTickets} className="font-semibold text-brand-600">
            View my tickets
          </Link>
        </StatusBox>
      ) : order.status === 'cancelled' ? (
        <StatusBox tone="neutral" title="Order cancelled" text="The held tickets were released.">
          <Link to={paths.eventDetail(event.id)} className="font-semibold text-brand-600">
            Back to event
          </Link>
        </StatusBox>
      ) : isExpired ? (
        <StatusBox tone="neutral" title="Hold expired" text="Your tickets were released. Please try again.">
          <Link to={paths.eventDetail(event.id)} className="font-semibold text-brand-600">
            Back to event
          </Link>
        </StatusBox>
      ) : (
        <>
          <section className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <CreditCard className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">Test payment</p>
              <p className="text-xs text-slate-500">Simulated — no money is charged.</p>
            </div>
          </section>

          <div className="mt-6 space-y-3">
            <Button fullWidth onClick={() => payMutation.mutate()} isLoading={payMutation.isPending} disabled={isBusy}>
              Pay {formatRupiah(order.total)}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => cancelMutation.mutate()}
              isLoading={cancelMutation.isPending}
              disabled={isBusy}
            >
              Cancel order
            </Button>
          </div>
        </>
      )}
    </>
  )
}

interface StatusBoxProps {
  tone: 'success' | 'neutral'
  title: string
  text: string
  children: ReactNode
}

function StatusBox({ tone, title, text, children }: StatusBoxProps) {
  return (
    <div
      className={
        tone === 'success'
          ? 'mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center'
          : 'mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center'
      }
    >
      {tone === 'success' && <CircleCheck className="mx-auto size-8 text-emerald-600" aria-hidden />}
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-0.5 text-sm text-slate-600">{text}</p>
      <div className="mt-3 text-sm">{children}</div>
    </div>
  )
}
