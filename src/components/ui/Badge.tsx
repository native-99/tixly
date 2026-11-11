import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-900/5 text-ink-600 ring-ink-900/5',
  brand: 'bg-brand-50 text-brand-700 ring-brand-500/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-500/15',
  warning: 'bg-amber-50 text-amber-800 ring-amber-500/15',
  danger: 'bg-red-50 text-red-700 ring-red-500/15',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}
