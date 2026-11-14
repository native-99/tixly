import { CalendarDays, QrCode, ShieldCheck } from 'lucide-react'
import { Outlet } from 'react-router'
import { Logo } from '../Logo'

const highlights = [
  { icon: CalendarDays, title: 'Events in one place', text: 'Concerts, comedy, meetups and festivals.' },
  { icon: QrCode, title: 'One scan, one entry', text: 'Every ticket has its own QR code.' },
  { icon: ShieldCheck, title: 'Sold out means sold out', text: 'Quota is locked while you pay.' },
]

/** Split layout for login and sign-up: a colour panel next to the form. */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Mesh of soft colour, slowly drifting. */}
        <div className="absolute inset-0 bg-[radial-gradient(48rem_38rem_at_12%_8%,rgb(99_102_241/0.55),transparent_62%),radial-gradient(38rem_30rem_at_88%_18%,rgb(168_85_247/0.45),transparent_60%),radial-gradient(42rem_32rem_at_55%_96%,rgb(236_72_153/0.28),transparent_62%)]" />
        <div className="animate-drift absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="animate-drift absolute -bottom-28 -left-16 size-80 rounded-full bg-cyan-300/10 blur-3xl [animation-delay:-4s]" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2 text-sm font-semibold ring-1 ring-white/15 backdrop-blur-xl">
            <TicketGlyph />
            Tixly
          </span>
          <h1 className="mt-10 max-w-md text-4xl leading-[1.08] font-extrabold tracking-[-0.035em]">
            Tickets that move at your speed.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/70">
            Pick your seats, pay in a second, and walk in with a QR code. Organizers and gate staff
            get the same app.
          </p>
        </div>

        <ul className="relative mt-12 space-y-3">
          {highlights.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-3.5 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-xl"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white/90">
                <item.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold">{item.title}</span>
                <span className="block text-sm text-white/65">{item.text}</span>
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
          <div className="animate-rise w-full rounded-3xl bg-white/85 p-6 shadow-lift ring-1 ring-ink-900/5 backdrop-blur-2xl sm:p-8 lg:p-10">
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
