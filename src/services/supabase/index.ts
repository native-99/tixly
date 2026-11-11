import type { Services } from '../types'
import { supabaseAuthService } from './auth'
import { supabaseEventService } from './events'
import { supabaseOrderService } from './orders'
import { supabaseTicketService } from './tickets'

export const supabaseServices: Services = {
  auth: supabaseAuthService,
  events: supabaseEventService,
  orders: supabaseOrderService,
  tickets: supabaseTicketService,
}
