import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-glow hover:from-brand-500 hover:to-brand-700 hover:brightness-110 active:brightness-95 disabled:from-ink-200 disabled:to-ink-200 disabled:text-ink-400 disabled:shadow-none',
  secondary:
    'border border-ink-200/80 bg-white/80 text-ink-700 shadow-soft backdrop-blur hover:border-brand-200 hover:bg-white hover:text-brand-700 active:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-900/5 hover:text-ink-900 active:bg-ink-900/10',
  danger:
    'border border-red-200/80 bg-red-50/80 text-red-600 hover:border-red-300 hover:bg-red-100 active:bg-red-200/60',
}

/** Shared with links, so a `<Link>` can look exactly like a `<Button>`. */
export function buttonClasses(variant: ButtonVariant = 'primary', fullWidth = false): string {
  return cn(
    // min-h-11 = 44px, the recommended minimum touch target on mobile
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold',
    'transition-all duration-200 active:scale-[0.98] active:shadow-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100',
    variantClasses[variant],
    fullWidth && 'w-full',
  )
}
