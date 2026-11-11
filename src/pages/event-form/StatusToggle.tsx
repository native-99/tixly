import { cn } from '@/lib/cn'
import type { EventStatus } from '@/types'

const options: Array<{ value: EventStatus; label: string; hint: string }> = [
  { value: 'draft', label: 'Draft', hint: 'Only you can see it.' },
  { value: 'published', label: 'Published', hint: 'Visible to everyone and on sale.' },
]

interface StatusToggleProps {
  value: EventStatus
  onChange(value: EventStatus): void
}

export function StatusToggle({ value, onChange }: StatusToggleProps) {
  return (
    <div role="radiogroup" aria-label="Visibility" className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-2xl border p-3.5 text-left transition-all duration-200',
              isSelected
                ? 'border-brand-400 bg-brand-50/80 shadow-soft ring-1 ring-brand-400/30'
                : 'border-ink-200 bg-white/80 hover:border-brand-200 hover:bg-white',
            )}
          >
            <p
              className={cn(
                'text-sm font-bold',
                isSelected ? 'text-brand-700' : 'text-ink-800',
              )}
            >
              {option.label}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">{option.hint}</p>
          </button>
        )
      })}
    </div>
  )
}
