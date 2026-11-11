import { describe, expect, it } from 'vitest'
import { AppError } from '../errors'
import { mapSupabaseError } from './errors'

describe('mapSupabaseError', () => {
  it('keeps an AppError as it is', () => {
    const original = new AppError('VALIDATION', 'Title is required.')
    expect(mapSupabaseError(original)).toBe(original)
  })

  it('reads the code prefix a Postgres function raised', () => {
    const error = mapSupabaseError({ message: 'SOLD_OUT: Early Bird is sold out.' })
    expect(error.code).toBe('SOLD_OUT')
    expect(error.message).toBe('Early Bird is sold out.')
  })

  it('maps a Postgres error code', () => {
    expect(mapSupabaseError({ message: 'not found', code: 'PGRST116' }).code).toBe('NOT_FOUND')
    expect(mapSupabaseError({ message: 'duplicate key', code: '23505' }).code).toBe('VALIDATION')
  })

  it('maps the Supabase Auth messages', () => {
    expect(mapSupabaseError({ message: 'Invalid login credentials' }).code).toBe(
      'INVALID_CREDENTIALS',
    )
    expect(mapSupabaseError({ message: 'Email not confirmed' }).code).toBe('UNAUTHENTICATED')
    expect(mapSupabaseError({ message: 'User already registered' }).code).toBe('EMAIL_TAKEN')
  })

  it('falls back to a readable message', () => {
    expect(mapSupabaseError({ message: 'something odd' }).message).toBe('something odd')
    expect(mapSupabaseError(new Error('boom')).message).toBe('boom')
  })
})
