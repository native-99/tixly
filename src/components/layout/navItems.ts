import { CalendarDays, LayoutGrid, LogIn, Plus, ScanLine, Ticket, User, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'
import type { Role } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const account: NavItem = { to: paths.account, label: 'Account', icon: User }

/** Bottom navigation per role. `null` = signed out. */
export function navItemsFor(role: Role | null): NavItem[] {
  switch (role) {
    case null:
      return [
        { to: paths.events, label: 'Events', icon: CalendarDays },
        { to: paths.login, label: 'Log in', icon: LogIn },
      ]
    case 'buyer':
      return [
        { to: paths.events, label: 'Events', icon: CalendarDays },
        { to: paths.myTickets, label: 'My tickets', icon: Ticket },
        account,
      ]
    case 'organizer':
      return [
        { to: paths.organizerEvents, label: 'My events', icon: LayoutGrid },
        { to: paths.newEvent, label: 'New event', icon: Plus },
        account,
      ]
    case 'staff':
      return [{ to: paths.scan, label: 'Scan', icon: ScanLine }, account]
  }
}
