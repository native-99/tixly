import type { Role } from '@/types'

/** Demo accounts shown on the login page. They exist in the mock seed
 *  today and will be seeded into Supabase in the backend stage. */
export const DEMO_PASSWORD = 'demo1234'

export const DEMO_ACCOUNTS: ReadonlyArray<{ role: Role; email: string; label: string }> = [
  { role: 'buyer', email: 'buyer@tixly.dev', label: 'Buyer' },
  { role: 'organizer', email: 'organizer@tixly.dev', label: 'Organizer' },
  { role: 'staff', email: 'staff@tixly.dev', label: 'Gate staff' },
]

/** Seeded ticket codes, offered as one-tap samples on the scan page. */
export const DEMO_TICKET_CODES = {
  ready: 'TX-7KQ2M9XRPA4D',
  ready2: 'TX-H3VN8WC5TJ6B',
  ready3: 'TX-2PLD4YQ7GM9K',
  used: 'TX-R8FS3NB6XW2E',
} as const
