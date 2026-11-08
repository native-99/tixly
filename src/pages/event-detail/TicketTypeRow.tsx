import { AvailabilityBadge } from '@/components/events/AvailabilityBadge'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { formatRupiah } from '@/lib/format'
import { MAX_QTY_PER_ITEM } from '@/services'
import type { TicketTypeWithAvailability } from '@/types'

interface TicketTypeRowProps {
  ticketType: TicketTypeWithAvailability
  quantity: number
  canSelect: boolean
  onChange(quantity: number): void
}

export function TicketTypeRow({ ticketType, quantity, canSelect, onChange }: TicketTypeRowProps) {
  const isSoldOut = ticketType.remaining === 0
  const max = Math.min(ticketType.remaining, MAX_QTY_PER_ITEM)

  return (
    <li className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900">{ticketType.name}</p>
          <AvailabilityBadge remaining={ticketType.remaining} />
        </div>
        <p className={isSoldOut ? 'mt-0.5 text-sm text-slate-400 line-through' : 'mt-0.5 text-sm text-slate-600'}>
          {formatRupiah(ticketType.price)}
        </p>
      </div>
      {canSelect && !isSoldOut && (
        <QuantityStepper value={quantity} max={max} label={ticketType.name} onChange={onChange} />
      )}
    </li>
  )
}
