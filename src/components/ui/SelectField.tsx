import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
}

export function SelectField({
  label,
  options,
  error,
  hint,
  className,
  id,
  ...rest
}: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'block min-h-12 w-full appearance-none rounded-2xl bg-white/90 pr-11 pl-4 text-base font-medium text-ink-900 ring-1 transition-all duration-200',
            'focus:bg-white focus:ring-4 focus:outline-none',
            error
              ? 'ring-red-300 focus:ring-red-400 focus:ring-red-500/12'
              : 'ring-ink-900/10 hover:ring-ink-900/15 focus:ring-brand-400 focus:ring-brand-500/12',
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden
        />
      </div>
      {error ? (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
