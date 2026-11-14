import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, className, id, ...rest }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          // text-base (16px) stops iOS Safari from zooming in on focus
          'block min-h-12 w-full rounded-2xl bg-white/90 px-4 text-base text-ink-900 ring-1 transition-all duration-200',
          'placeholder:text-ink-400',
          'focus:bg-white focus:ring-4 focus:outline-none',
          error
            ? 'ring-red-300 focus:ring-red-400 focus:ring-red-500/12'
            : 'ring-ink-900/10 hover:ring-ink-900/15 focus:ring-brand-400 focus:ring-brand-500/12',
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
