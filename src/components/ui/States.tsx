import { CircleAlert, Inbox, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { getErrorMessage } from '@/services'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white/70 px-6 py-14 text-center backdrop-blur-sm">
      <span className="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand-100 to-brand-50 text-brand-600">
        <Inbox className="size-6" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-bold tracking-tight text-ink-900">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-3xl border border-red-200/80 bg-red-50/70 px-6 py-12 text-center backdrop-blur-sm"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-red-100 text-red-500">
        <CircleAlert className="size-6" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-bold tracking-tight text-red-900">Couldn't load this</p>
      <p className="mt-1.5 max-w-sm text-sm text-red-700/90">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-ink-200/70 ${className}`} aria-hidden />
}
