import { Ticket } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/routes/paths'

export function Logo() {
  return (
    <Link to={paths.events} className="group inline-flex items-center gap-2.5 text-lg font-extrabold">
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-violet-600 text-white shadow-glow transition-transform duration-200 group-hover:scale-105">
        <Ticket className="size-5" aria-hidden />
      </span>
      <span className="bg-linear-to-r from-ink-900 to-brand-700 bg-clip-text text-transparent">
        Tixly
      </span>
    </Link>
  )
}
