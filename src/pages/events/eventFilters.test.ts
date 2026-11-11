import { describe, expect, it } from 'vitest'
import type { EventSummary } from '@/types'
import { defaultEventFilters, filterEvents, hasActiveFilters } from './eventFilters'

const now = new Date('2026-11-10T12:00:00.000Z')

function event(overrides: Partial<EventSummary>): EventSummary {
  return {
    id: 'evt_1',
    organizerId: 'org_1',
    title: 'Senja Sound Festival',
    description: '',
    venue: 'Lapangan Banteng',
    city: 'Jakarta',
    category: 'festival',
    startsAt: '2026-11-20T10:00:00.000Z',
    posterUrl: null,
    status: 'published',
    createdAt: now.toISOString(),
    minPrice: 100_000,
    capacity: 100,
    remaining: 50,
    ...overrides,
  }
}

const events = [
  event({}),
  event({
    id: 'evt_2',
    title: 'Tawa Malam',
    city: 'Surabaya',
    category: 'comedy',
    startsAt: '2026-11-12T10:00:00.000Z',
  }),
  event({
    id: 'evt_3',
    title: 'Bandung Tech Meetup',
    venue: 'Braga Hub',
    city: 'Bandung',
    category: 'meetup',
    startsAt: '2026-12-20T10:00:00.000Z',
  }),
]

describe('event filters', () => {
  it('returns everything by default', () => {
    expect(filterEvents(events, defaultEventFilters, now)).toHaveLength(3)
  })

  it('matches the query against title, venue, city and category', () => {
    expect(filterEvents(events, { ...defaultEventFilters, query: 'braga' }, now).map((e) => e.id)).toEqual(['evt_3'])
    expect(filterEvents(events, { ...defaultEventFilters, query: 'comedy' }, now).map((e) => e.id)).toEqual(['evt_2'])
  })

  it('filters by city and category', () => {
    expect(filterEvents(events, { ...defaultEventFilters, city: 'Jakarta' }, now)).toHaveLength(1)
    expect(filterEvents(events, { ...defaultEventFilters, category: 'meetup' }, now)[0]?.id).toBe('evt_3')
  })

  it('filters by date range', () => {
    expect(filterEvents(events, { ...defaultEventFilters, date: 'week' }, now).map((e) => e.id)).toEqual(['evt_2'])
    expect(filterEvents(events, { ...defaultEventFilters, date: 'month' }, now)).toHaveLength(2)
  })

  it('knows when filters are active', () => {
    expect(hasActiveFilters(defaultEventFilters)).toBe(false)
    expect(hasActiveFilters({ ...defaultEventFilters, query: 'jazz' })).toBe(true)
    expect(hasActiveFilters({ ...defaultEventFilters, city: 'Bali' })).toBe(true)
  })
})
