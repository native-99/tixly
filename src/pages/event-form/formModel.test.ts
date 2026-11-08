import { describe, expect, it } from 'vitest'
import {
  emptyTicketType,
  emptyValues,
  hasErrors,
  isoToLocalInput,
  toEventInput,
  validate,
  type EventFormValues,
} from './formModel'

function validValues(): EventFormValues {
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  return {
    ...emptyValues(),
    title: 'Test Event',
    venue: 'Hall',
    city: 'Jakarta',
    startsAtLocal: isoToLocalInput(nextWeek),
    ticketTypes: [{ ...emptyTicketType(), name: 'Regular', price: '100000', quota: '50' }],
  }
}

describe('event form validation', () => {
  it('accepts a complete form', () => {
    expect(hasErrors(validate(validValues()))).toBe(false)
  })

  it('requires the basic fields', () => {
    const errors = validate(emptyValues())
    expect(errors.title).toBeDefined()
    expect(errors.venue).toBeDefined()
    expect(errors.city).toBeDefined()
    expect(errors.startsAtLocal).toBeDefined()
  })

  it('rejects events in the past', () => {
    const values = { ...validValues(), startsAtLocal: '2020-01-01T10:00' }
    expect(validate(values).startsAtLocal).toMatch(/future/)
  })

  it('needs a ticket type before publishing', () => {
    const values: EventFormValues = { ...validValues(), status: 'published', ticketTypes: [] }
    expect(validate(values).ticketTypes).toBeDefined()
    expect(hasErrors(validate({ ...values, status: 'draft' }))).toBe(false)
  })

  it('validates each ticket row, including quota already taken', () => {
    const row = { ...emptyTicketType(), name: '', price: '12.5', quota: '3', taken: 10 }
    const errors = validate({ ...validValues(), ticketTypes: [row] })
    expect(errors.rows[row.key]).toEqual({
      name: expect.any(String),
      price: expect.any(String),
      quota: expect.stringContaining('10'),
    })
  })

  it('round-trips the local date input to an ISO date', () => {
    const iso = '2030-05-17T12:30:00.000Z'
    const values = { ...validValues(), startsAtLocal: isoToLocalInput(iso) }
    expect(toEventInput(values).startsAt).toBe(iso)
  })
})
