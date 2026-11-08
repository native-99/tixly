import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  max: number
  label: string
  onChange(value: number): void
}

export function QuantityStepper({ value, max, label, onChange }: QuantityStepperProps) {
  const buttonClass =
    'grid size-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={value <= 0}
        aria-label={`Remove one ${label}`}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Add one ${label}`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}
