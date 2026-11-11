import { CalendarDays, QrCode, ShieldCheck } from 'lucide-react'
import { Outlet } from 'react-router'
import { Logo } from '../Logo'

const highlights = [
  { icon: CalendarDays, title: 'Events in one place', text: 'Concerts, comedy, meetups and festivals.' },
  { icon: QrCode, title: 'One scan, one entry', text: 'Every ticket has its own QR code.' },
  { icon: ShieldCheck, title: 'Sold out means sold out', text: 'Quota is locked while you pay.' },
]

/** Split layout for login and sign-up: a gradient panel next to the form. */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-600 via-brand-700 to-violet-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 size-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-2 text-sm font-semibold backdrop-blur">
            <TicketGlyph />
            Tixly
          </span>
          <h1 className="mt-10 max-w-md text-4xl font-extrabold tracking-tight">
            Tickets that move at your speed.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/75">
            Pick your seats, pay in a second, and walk in with a QR code. Organizers and gate staff
            get the same app.
          </p>
        </div>

        <ul className="relative mt-12 space-y-4">
          {highlights.map((item) => (
            <li key={item.title} className="flex items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <item.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold">{item.title}</span>
                <span className="block text-sm text-white/70">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-col px-5 pt-8 pb-12 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <main className="mx-auto flex w-full max-w-md flex-1 items-center py-8">
          <div className="w-full rounded-3xl border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm sm:p-8 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function TicketGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
      <path
        d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 6v12" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2 2" />
    </svg>
  )
}
