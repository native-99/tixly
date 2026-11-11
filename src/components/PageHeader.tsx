import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 md:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-500 md:text-[15px]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
