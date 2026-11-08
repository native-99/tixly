import type { Role } from '@/types'

/** Demo accounts shown on the login page. They exist in the mock seed
 *  today and will be seeded into Supabase in the backend stage. */
export const DEMO_PASSWORD = 'demo1234'

export const DEMO_ACCOUNTS: ReadonlyArray<{ role: Role; email: string; label: string }> = [
  { role: 'buyer', email: 'buyer@tixly.dev', label: 'Buyer' },
  { role: 'organizer', email: 'organizer@tixly.dev', label: 'Organizer' },
  { role: 'staff', email: 'staff@tixly.dev', label: 'Gate staff' },
]
