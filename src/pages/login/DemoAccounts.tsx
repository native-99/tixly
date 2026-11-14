import { ScanLine, Store, Ticket } from 'lucide-react'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/config/demo'
import type { Role } from '@/types'

const roleIcon: Record<Role, typeof Ticket> = {
  buyer: Ticket,
  organizer: Store,
  staff: ScanLine,
}

interface DemoAccountsProps {
  disabled: boolean
  onPick(email: string, password: string): void
}

/** One-tap sign-in for reviewers trying the demo. */
export function DemoAccounts({ disabled, onPick }: DemoAccountsProps) {
  return (
    <section className="mt-8 rounded-3xl bg-ink-50/80 p-4 ring-1 ring-ink-900/5">
      <h2 className="text-sm font-bold text-ink-900">Try a demo account</h2>
      <p className="mt-1 text-xs text-ink-500">
        Password for all: <code className="rounded-lg bg-white px-1.5 py-0.5 font-mono">{DEMO_PASSWORD}</code>
      </p>
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = roleIcon[account.role]
          return (
            <button
              key={account.email}
              type="button"
              disabled={disabled}
              onClick={() => onPick(account.email, DEMO_PASSWORD)}
              className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-xs font-semibold text-ink-700 shadow-soft ring-1 ring-ink-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-700 hover:ring-brand-500/25 disabled:opacity-60"
            >
              <Icon className="size-5 text-brand-600" aria-hidden />
              {account.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
