// Single place where the app picks its data backend.
//
// Default is Supabase. Set VITE_DATA_SOURCE=mock in .env.local to fall back to
// the browser-only mock services (handy for screenshots and UI work offline).

import { mockAuthService } from './mock/auth'
import { mockEventService } from './mock/events'
import { mockOrderService } from './mock/orders'
import { mockTicketService } from './mock/tickets'
import { supabaseServices } from './supabase'
import type { Services } from './types'

const useMock = import.meta.env.VITE_DATA_SOURCE === 'mock'

export const services: Services = useMock
  ? {
      auth: mockAuthService,
      events: mockEventService,
      orders: mockOrderService,
      tickets: mockTicketService,
    }
  : supabaseServices

/** Shown on the login page when Supabase mode is on. */
export const dataSource = useMock ? 'mock' : 'supabase'

export * from './constants'
export * from './errors'
export type * from './types'
