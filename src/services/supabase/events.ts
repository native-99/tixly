import { resizeImageToBlob } from '@/lib/image'
import type { TicketType } from '@/types'
import { AppError } from '../errors'
import type { EventInput, EventService, TicketTypeInput } from '../types'
import { getSupabase, requireUserId } from './client'
import { mapSupabaseError } from './errors'
import {
  toEvent,
  toEventDetail,
  toEventSummary,
  type EventDetailPayload,
  type EventRow,
  type EventSummaryRow,
} from './mappers'

const MAX_POSTER_BYTES = 5 * 1024 * 1024
const POSTER_BUCKET = 'posters'

function validateEvent(input: EventInput): void {
  if (!input.title.trim()) throw new AppError('VALIDATION', 'Title is required.')
  if (!input.venue.trim()) throw new AppError('VALIDATION', 'Venue is required.')
  if (!input.city.trim()) throw new AppError('VALIDATION', 'City is required.')
  if (Number.isNaN(new Date(input.startsAt).getTime())) {
    throw new AppError('VALIDATION', 'Please choose a valid date and time.')
  }
}

function validateTicketType(input: TicketTypeInput): void {
  if (!input.name.trim()) throw new AppError('VALIDATION', 'Ticket name is required.')
  if (!Number.isInteger(input.price) || input.price < 0) {
    throw new AppError('VALIDATION', 'Price must be a whole number of rupiah.')
  }
  if (!Number.isInteger(input.quota) || input.quota < 1) {
    throw new AppError('VALIDATION', 'Quota must be at least 1.')
  }
}

function toColumns(input: EventInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    venue: input.venue.trim(),
    city: input.city.trim(),
    starts_at: input.startsAt,
    poster_url: input.posterUrl,
    status: input.status,
  }
}

export const supabaseEventService: EventService = {
  async listPublished() {
    const { data, error } = await getSupabase().rpc('list_published_events')
    if (error) throw mapSupabaseError(error)
    return (data as EventSummaryRow[]).map(toEventSummary)
  },

  async getById(eventId) {
    const { data, error } = await getSupabase().rpc('get_event', { p_event_id: eventId })
    if (error) throw mapSupabaseError(error)
    if (!data) return null
    return toEventDetail(data as EventDetailPayload)
  },

  async listMine() {
    const { data, error } = await getSupabase().rpc('list_my_events')
    if (error) throw mapSupabaseError(error)
    return (data as EventSummaryRow[]).map(toEventSummary)
  },

  async createEvent(input) {
    validateEvent(input)
    const organizerId = await requireUserId()

    const { data, error } = await getSupabase()
      .from('events')
      .insert({ ...toColumns(input), organizer_id: organizerId })
      .select('*')
      .single<EventRow>()

    if (error) throw mapSupabaseError(error)
    return toEvent(data)
  },

  async updateEvent(eventId, input) {
    validateEvent(input)

    const { data, error } = await getSupabase()
      .from('events')
      .update(toColumns(input))
      .eq('id', eventId)
      .select('*')
      .maybeSingle<EventRow>()

    if (error) throw mapSupabaseError(error)
    // RLS hides events this user doesn't own, so no row means "not yours".
    if (!data) throw new AppError('NOT_FOUND', 'Event not found.')
    return toEvent(data)
  },

  async createTicketType(eventId, input) {
    validateTicketType(input)

    const { data, error } = await getSupabase()
      .from('ticket_types')
      .insert({
        event_id: eventId,
        name: input.name.trim(),
        price: input.price,
        quota: input.quota,
      })
      .select('id, event_id, name, price, quota')
      .single<{
        id: string
        event_id: string
        name: string
        price: number
        quota: number
      }>()

    if (error) throw mapSupabaseError(error)
    return {
      id: data.id,
      eventId: data.event_id,
      name: data.name,
      price: data.price,
      quota: data.quota,
    } satisfies TicketType
  },

  async updateTicketType(ticketTypeId, input) {
    validateTicketType(input)

    // A database trigger rejects quotas below what is already sold or on hold,
    // which keeps the rule in one place for every client.
    const { data, error } = await getSupabase()
      .from('ticket_types')
      .update({ name: input.name.trim(), price: input.price, quota: input.quota })
      .eq('id', ticketTypeId)
      .select('id, event_id, name, price, quota')
      .maybeSingle<{
        id: string
        event_id: string
        name: string
        price: number
        quota: number
      }>()

    if (error) throw mapSupabaseError(error)
    if (!data) throw new AppError('NOT_FOUND', 'Ticket type not found.')
    return {
      id: data.id,
      eventId: data.event_id,
      name: data.name,
      price: data.price,
      quota: data.quota,
    } satisfies TicketType
  },

  async uploadPoster(file) {
    const userId = await requireUserId()
    if (!file.type.startsWith('image/')) {
      throw new AppError('VALIDATION', 'Please choose an image file.')
    }
    if (file.size > MAX_POSTER_BYTES) {
      throw new AppError('VALIDATION', 'Image must be 5 MB or smaller.')
    }

    let blob: Blob
    try {
      blob = await resizeImageToBlob(file)
    } catch {
      throw new AppError('VALIDATION', "Couldn't read that image. Try a JPG or PNG.")
    }

    // The bucket policy only allows writes under the user's own folder.
    const path = `${userId}/${crypto.randomUUID()}.jpg`
    const { error } = await getSupabase()
      .storage.from(POSTER_BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

    if (error) throw mapSupabaseError(error)
    return getSupabase().storage.from(POSTER_BUCKET).getPublicUrl(path).data.publicUrl
  },
}
