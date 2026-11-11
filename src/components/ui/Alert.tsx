import { CircleAlert, CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50/80 p-3.5 text-sm font-medium text-red-700 backdrop-blur-sm"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function SuccessAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-3.5 text-sm font-medium text-emerald-800 backdrop-blur-sm"
    >
      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
