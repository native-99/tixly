import { Ticket } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/routes/paths'

export function Logo() {
  return (
    <Link to={paths.events} className="inline-flex items-center gap-1.5 text-lg font-bold text-brand-600">
      <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-white">
        <Ticket className="size-4" aria-hidden />
      </span>
      Tixly
    </Link>
  )
}
