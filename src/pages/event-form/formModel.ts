// Form state, conversions and validation for the event form.
// Kept separate from the UI so the rules are easy to read and test.

import type { EventInput, TicketTypeInput } from '@/services'
import type { EventCategory, EventDetail, EventStatus } from '@/types'

export interface TicketTypeDraft {
  /** Stable React key; also used to attach row errors. */
  key: string
  /** null = not saved yet */
  id: string | null
  name: string
  /** Kept as strings while typing; parsed on save. */
  price: string
  quota: string
  /** Tickets already sold or on hold — quota can't go below this. */
  taken: number
}

export interface EventFormValues {
  title: string
  description: string
  category: EventCategory
  venue: string
  city: string
  /** "YYYY-MM-DDTHH:mm" in local time, as used by <input type="datetime-local"> */
  startsAtLocal: string
  posterUrl: string | null
  status: EventStatus
  ticketTypes: TicketTypeDraft[]
}

export type TicketTypeErrors = Partial<Record<'name' | 'price' | 'quota', string>>

export interface FormErrors {
  title?: string
  venue?: string
  city?: string
  startsAtLocal?: string
  ticketTypes?: string
  rows: Record<string, TicketTypeErrors>
}

let draftCounter = 0
function newDraftKey(): string {
  draftCounter++
  return `draft-${draftCounter}`
}

export function emptyTicketType(): TicketTypeDraft {
  return { key: newDraftKey(), id: null, name: '', price: '', quota: '', taken: 0 }
}

/** ISO → value for <input type="datetime-local"> (local time). */
export function isoToLocalInput(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

export function emptyValues(): EventFormValues {
  return {
    title: '',
    description: '',
    category: 'festival',
    venue: '',
    city: '',
    startsAtLocal: '',
    posterUrl: null,
    status: 'draft',
    ticketTypes: [emptyTicketType()],
  }
}

export function valuesFromEvent(event: EventDetail): EventFormValues {
  const ticketTypes: TicketTypeDraft[] = []
  for (const ticketType of event.ticketTypes) {
    ticketTypes.push({
      key: ticketType.id,
      id: ticketType.id,
      name: ticketType.name,
      price: String(ticketType.price),
      quota: String(ticketType.quota),
      taken: ticketType.quota - ticketType.remaining,
    })
  }
  return {
    title: event.title,
    description: event.description,
    category: event.category,
    venue: event.venue,
    city: event.city,
    startsAtLocal: isoToLocalInput(event.startsAt),
    posterUrl: event.posterUrl,
    status: event.status,
    ticketTypes,
  }
}

function isWholeNumber(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

export function validate(values: EventFormValues): FormErrors {
  const errors: FormErrors = { rows: {} }

  if (!values.title.trim()) errors.title = 'Give your event a title.'
  if (!values.venue.trim()) errors.venue = 'Where is it happening?'
  if (!values.city.trim()) errors.city = 'Which city?'

  if (!values.startsAtLocal) {
    errors.startsAtLocal = 'Choose a date and time.'
  } else if (new Date(values.startsAtLocal).getTime() <= Date.now()) {
    errors.startsAtLocal = 'The event must be in the future.'
  }

  if (values.status === 'published' && values.ticketTypes.length === 0) {
    errors.ticketTypes = 'Add at least one ticket type before publishing.'
  }

  for (const row of values.ticketTypes) {
    const rowErrors: TicketTypeErrors = {}
    if (!row.name.trim()) rowErrors.name = 'Name required.'
    if (!isWholeNumber(row.price)) rowErrors.price = 'Whole rupiah only.'
    if (!isWholeNumber(row.quota) || Number(row.quota) < 1) {
      rowErrors.quota = 'At least 1.'
    } else if (Number(row.quota) < row.taken) {
      rowErrors.quota = `At least ${row.taken} (already taken).`
    }
    if (Object.keys(rowErrors).length > 0) errors.rows[row.key] = rowErrors
  }

  return errors
}

export function hasErrors(errors: FormErrors): boolean {
  const { rows, ...fieldErrors } = errors
  return Object.values(fieldErrors).some(Boolean) || Object.keys(rows).length > 0
}

export function toEventInput(values: EventFormValues): EventInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    venue: values.venue.trim(),
    city: values.city.trim(),
    startsAt: new Date(values.startsAtLocal).toISOString(),
    posterUrl: values.posterUrl,
    status: values.status,
  }
}

export function toTicketTypeInput(row: TicketTypeDraft): TicketTypeInput {
  return { name: row.name.trim(), price: Number(row.price), quota: Number(row.quota) }
}
