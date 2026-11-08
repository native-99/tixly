import { paths } from '@/routes/paths'
import type { Role } from '@/types'

/** Where each role lands after signing in. */
export function homePathFor(role: Role): string {
  switch (role) {
    case 'buyer':
      return paths.events
    case 'organizer':
      return paths.organizerEvents
    case 'staff':
      return paths.scan
  }
}

export const roleLabel: Record<Role, string> = {
  buyer: 'Buyer',
  organizer: 'Organizer',
  staff: 'Gate staff',
}

/** Only allow same-app paths as a post-login redirect (blocks "//evil.com"). */
export function safeRedirectPath(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}
