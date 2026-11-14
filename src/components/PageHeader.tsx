import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  /** Small label above the title, e.g. "Purchase history". */
  eyebrow?: string
}

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-2.5 inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold tracking-widest text-brand-700 uppercase ring-1 ring-brand-500/10">
            {eyebrow}
          </span>
        )}
        <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em] text-ink-900 md:text-[32px]">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm text-ink-500 md:text-[15px]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
