import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  max: number
  label: string
  onChange(value: number): void
}

export function QuantityStepper({ value, max, label, onChange }: QuantityStepperProps) {
  const buttonClass =
    'grid size-10 place-items-center rounded-xl border border-ink-200/80 bg-white/90 text-ink-600 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200/80 disabled:hover:bg-white/90 disabled:hover:text-ink-600'

  return (
    <div
      className="flex items-center gap-1.5 rounded-2xl border border-ink-200/80 bg-ink-50/70 p-1"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={value <= 0}
        aria-label={`Remove one ${label}`}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="w-6 text-center text-sm font-bold tabular-nums text-ink-900" aria-live="polite">
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
