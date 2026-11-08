// Single place where the app picks its data backend.
// To switch to Supabase later, export the Supabase implementations here.

import { mockAuthService } from './mock/auth'
import { mockEventService } from './mock/events'
import { mockOrderService } from './mock/orders'
import { mockTicketService } from './mock/tickets'
import type { Services } from './types'

export const services: Services = {
  auth: mockAuthService,
  events: mockEventService,
  orders: mockOrderService,
  tickets: mockTicketService,
}

export * from './constants'
export * from './errors'
export type * from './types'
