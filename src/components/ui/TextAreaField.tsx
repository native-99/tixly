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
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'block min-h-28 w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none',
          error ? 'border-red-400' : 'border-slate-300',
        )}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
