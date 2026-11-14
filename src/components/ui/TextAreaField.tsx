import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextAreaField({ label, error, className, id, ...rest }: TextAreaFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'block min-h-28 w-full rounded-2xl bg-white/90 px-4 py-3 text-base text-ink-900 ring-1 transition-all duration-200',
          'placeholder:text-ink-400',
          'focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
          error
            ? 'ring-red-300 focus:ring-red-400 focus:ring-red-500/12'
            : 'ring-ink-900/10 hover:ring-ink-900/15 focus:ring-brand-400 focus:ring-brand-500/12',
        )}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
