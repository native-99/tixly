import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  max: number
  label: string
  onChange(value: number): void
}

export function QuantityStepper({ value, max, label, onChange }: QuantityStepperProps) {
  const buttonClass =
    'grid size-9 place-items-center rounded-xl bg-white text-ink-600 shadow-soft ring-1 ring-ink-900/5 transition-all duration-200 hover:-translate-y-px hover:text-brand-700 hover:ring-brand-500/25 active:scale-95 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      className="flex items-center gap-1 rounded-2xl bg-ink-50/80 p-1 ring-1 ring-ink-900/5"
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
