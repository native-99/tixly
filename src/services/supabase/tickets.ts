import type { CheckInResult, CheckInStatus } from '@/types'
import type { TicketService } from '../types'
import { getSupabase } from './client'
import { mapSupabaseError } from './errors'
import { toTicket, type TicketPayload } from './mappers'

interface ListTicketRow extends Omit<TicketPayload, 'ticketTypeName' | 'event'> {
  ticket_type_name: string
  event: TicketPayload['event']
}

export const supabaseTicketService: TicketService = {
  async listMine() {
    const { data, error } = await getSupabase().rpc('list_my_tickets')
    if (error) throw mapSupabaseError(error)

    return (data as ListTicketRow[]).map((row) =>
      toTicket({
        ...row,
        ticketTypeName: row.ticket_type_name,
      }),
    )
  },

  async checkIn(code) {
    const { data, error } = await getSupabase().rpc('check_in_ticket', { p_code: code })
    if (error) throw mapSupabaseError(error)

    const payload = data as { status: CheckInStatus; ticket: TicketPayload | null }
    const result: CheckInResult = {
      status: payload.status,
      ticket: payload.ticket ? toTicket(payload.ticket) : null,
    }
    return result
  },
}
