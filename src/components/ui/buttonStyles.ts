import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-glow ring-1 ring-white/15 hover:-translate-y-px hover:brightness-[1.06] active:translate-y-0 active:brightness-95',
  secondary:
    'bg-white/90 text-ink-700 shadow-soft ring-1 ring-ink-900/8 hover:-translate-y-px hover:text-brand-700 hover:ring-brand-500/25 active:translate-y-0',
  ghost:
    'text-ink-600 hover:bg-ink-900/5 hover:text-ink-900 active:bg-ink-900/10',
  danger:
    'bg-red-50/90 text-red-600 ring-1 ring-red-200/80 hover:bg-red-100 hover:ring-red-300 active:bg-red-200/60',
}

/** Shared with links, so a `<Link>` can look exactly like a `<Button>`. */
export function buttonClasses(variant: ButtonVariant = 'primary', fullWidth = false): string {
  return cn(
    // min-h-11 = 44px, the recommended minimum touch target on mobile
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold',
    'transition-all duration-200 ease-out active:scale-[0.98]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100',
    variantClasses[variant],
    fullWidth && 'w-full',
  )
}
