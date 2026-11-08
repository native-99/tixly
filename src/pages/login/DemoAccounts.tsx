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
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">Try a demo account</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Password for all: <code className="rounded bg-slate-100 px-1">{DEMO_PASSWORD}</code>
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = roleIcon[account.role]
          return (
            <button
              key={account.email}
              type="button"
              disabled={disabled}
              onClick={() => onPick(account.email, DEMO_PASSWORD)}
              className="flex min-h-11 flex-col items-center gap-1 rounded-xl border border-slate-200 px-2 py-3 text-xs font-medium text-slate-700 transition-colors hover:border-brand-500 hover:bg-brand-50 disabled:opacity-60"
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
