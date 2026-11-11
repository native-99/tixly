import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, Clock, CreditCard, Mail } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
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

/** Copy only; the server still decides whether a gateway is available. */
const paymentMode = import.meta.env.VITE_PAYMENT_MODE === 'midtrans' ? 'midtrans' : 'simulated'

type EmailState = 'idle' | 'sending' | 'sent' | 'failed'

export function CheckoutView({ order, event }: CheckoutViewProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const msLeft = useCountdown(order.expiresAt)
  const [emailState, setEmailState] = useState<EmailState>(order.ticketsEmailedAt ? 'sent' : 'idle')
  const emailRequested = useRef(false)

  // The server decides the final status; the countdown hitting 0 is enough to
  // stop the buyer from paying in the UI.
  const isExpired = order.status === 'expired' || (order.status === 'pending' && msLeft === 0)

  const ticketTypeName = (ticketTypeId: string) =>
    event.ticketTypes.find((ticketType) => ticketType.id === ticketTypeId)?.name ?? 'Ticket'

  function refreshAfterChange() {
    queryClient.invalidateQueries({ queryKey: queryKeys.order(order.id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.events })
    queryClient.invalidateQueries({ queryKey: queryKeys.myTickets })
    queryClient.invalidateQueries({ queryKey: queryKeys.myOrders })
  }

  const payMutation = useMutation({
    mutationFn: () => services.orders.payOrder(order.id),
    onSuccess: () => {
      refreshAfterChange()
      // The simulated payment has no webhook, so deliver the email from here.
      services.orders.sendTickets(order.id).catch(() => undefined)
    },
    onError: refreshAfterChange,
  })

  const paymentMutation = useMutation({
    mutationFn: () => services.orders.startPayment(order.id),
    onSuccess: (session) => {
      if (session.simulated) {
        payMutation.mutate()
        return
      }
      if (session.redirectUrl) {
        // Leave the app for the gateway's hosted page.
        window.location.assign(session.redirectUrl)
        return
      }
      refreshAfterChange()
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

  // Returning from the gateway: the webhook already sent the email, but if it
  // failed (or hasn't run yet) this makes sure the buyer still gets it.
  useEffect(() => {
    if (order.status !== 'paid' || order.ticketsEmailedAt || emailRequested.current) return

    emailRequested.current = true
    setEmailState('sending')
    services.orders
      .sendTickets(order.id)
      .then((result) => {
        setEmailState(result.sent || result.alreadySent ? 'sent' : 'failed')
        if (result.emailedAt) {
          queryClient.setQueryData<Order | null>(queryKeys.order(order.id), (current) =>
            current ? { ...current, ticketsEmailedAt: result.emailedAt } : current,
          )
        }
      })
      .catch(() => setEmailState('failed'))
  }, [order.id, order.status, order.ticketsEmailedAt, queryClient])

  const resendMutation = useMutation({
    mutationFn: () => services.orders.sendTickets(order.id, { resend: true }),
    onSuccess: () => setEmailState('sent'),
    onError: () => setEmailState('failed'),
  })

  const actionError = paymentMutation.error ?? payMutation.error ?? cancelMutation.error
  const isBusy = paymentMutation.isPending || payMutation.isPending || cancelMutation.isPending
  // The order may already carry the sent timestamp (revisit, or the mock backend).
  const shownEmailState: EmailState =
    emailState === 'idle' && order.ticketsEmailedAt ? 'sent' : emailState

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Checkout" description="Your tickets are held while you pay." />

      {order.status === 'pending' && !isExpired && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm font-medium text-amber-900 backdrop-blur-sm">
          <Clock className="size-4 shrink-0" aria-hidden />
          <span>
            Tickets held for you for{' '}
            <span className="font-bold tabular-nums" role="timer">
              {formatCountdown(msLeft)}
            </span>
          </span>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-soft backdrop-blur-sm">
        <div className="flex gap-4 p-5">
          <EventCover event={event} className="size-20 shrink-0 rounded-2xl shadow-sm" />
          <div className="min-w-0">
            <p className="line-clamp-2 font-extrabold tracking-tight text-ink-900">{event.title}</p>
            <p className="mt-1 text-sm font-medium text-ink-500">{formatDateTime(event.startsAt)}</p>
            <p className="text-sm text-ink-500">
              {event.venue}, {event.city}
            </p>
          </div>
        </div>

        <ul className="divide-y divide-ink-100 border-t border-ink-100 px-5 text-sm">
          {order.items.map((item) => (
            <li key={item.ticketTypeId} className="flex justify-between gap-3 py-3.5">
              <span className="font-medium text-ink-700">
                {item.quantity} × {ticketTypeName(item.ticketTypeId)}
              </span>
              <span className="font-semibold tabular-nums text-ink-900">
                {formatRupiah(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-ink-100 bg-ink-50/70 px-5 py-4">
          <span className="font-bold text-ink-900">Total</span>
          <span className="bg-linear-to-r from-brand-600 to-violet-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent tabular-nums">
            {formatRupiah(order.total)}
          </span>
        </div>
      </section>

      {actionError && (
        <div className="mt-4">
          <ErrorAlert>{getErrorMessage(actionError)}</ErrorAlert>
        </div>
      )}

      {order.status === 'paid' ? (
        <StatusBox tone="success" title="Payment complete" text="Your tickets are ready.">
          <EmailStatus
            state={shownEmailState}
            isResending={resendMutation.isPending}
            onResend={() => resendMutation.mutate()}
          />
          <Link to={paths.myTickets} className="mt-3 inline-block font-semibold text-brand-700">
            View my tickets
          </Link>
        </StatusBox>
      ) : order.status === 'cancelled' ? (
        <StatusBox tone="neutral" title="Order cancelled" text="The held tickets were released.">
          <Link to={paths.eventDetail(event.id)} className="font-semibold text-brand-700">
            Back to event
          </Link>
        </StatusBox>
      ) : isExpired ? (
        <StatusBox tone="neutral" title="Hold expired" text="Your tickets were released. Please try again.">
          <Link to={paths.eventDetail(event.id)} className="font-semibold text-brand-700">
            Back to event
          </Link>
        </StatusBox>
      ) : (
        <>
          <section className="mt-5 flex items-center gap-3.5 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur-sm">
            <span className="grid size-11 place-items-center rounded-2xl bg-linear-to-br from-brand-100 to-brand-50 text-brand-600">
              <CreditCard className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">
                {paymentMode === 'midtrans' ? 'Secure payment' : 'Test payment'}
              </p>
              <p className="text-xs text-ink-500">
                {paymentMode === 'midtrans'
                  ? 'You will be redirected to Midtrans to pay.'
                  : 'Simulated — no money is charged.'}
              </p>
            </div>
          </section>

          <div className="mt-6 space-y-3">
            <Button
              fullWidth
              onClick={() => paymentMutation.mutate()}
              isLoading={paymentMutation.isPending || payMutation.isPending}
              disabled={isBusy}
            >
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
    </div>
  )
}

interface EmailStatusProps {
  state: EmailState
  isResending: boolean
  onResend(): void
}

function EmailStatus({ state, isResending, onResend }: EmailStatusProps) {
  if (state === 'idle') return null

  if (state === 'failed') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-500">
        <Mail className="size-4" aria-hidden />
        We couldn't email your tickets.
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="font-semibold text-brand-700 underline-offset-2 hover:underline disabled:opacity-60"
        >
          {isResending ? 'Sending…' : 'Try again'}
        </button>
      </div>
    )
  }

  return (
    <p className="flex items-center justify-center gap-1.5 text-sm text-ink-500" aria-live="polite">
      <Mail className="size-4" aria-hidden />
      {state === 'sending' ? 'Sending your tickets by email…' : 'Tickets also sent to your email.'}
    </p>
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
          ? 'mt-5 rounded-3xl border border-emerald-200/80 bg-emerald-50/80 p-6 text-center backdrop-blur-sm'
          : 'mt-5 rounded-3xl border border-white/70 bg-white/90 p-6 text-center shadow-soft backdrop-blur-sm'
      }
    >
      {tone === 'success' && (
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CircleCheck className="size-6" aria-hidden />
        </span>
      )}
      <p className="mt-3 text-lg font-extrabold tracking-tight text-ink-900">{title}</p>
      <p className="mt-1 text-sm text-ink-500">{text}</p>
      <div className="mt-3 text-sm">{children}</div>
    </div>
  )
}
