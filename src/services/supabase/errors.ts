import { AppError, type AppErrorCode } from '../errors'

const APP_ERROR_CODES: AppErrorCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_CREDENTIALS',
  'EMAIL_TAKEN',
  'SOLD_OUT',
  'ORDER_EXPIRED',
  'INVALID_STATE',
  'VALIDATION',
]

/**
 * Supabase/Postgres errors become the same AppError codes as the mock
 * services, so pages and the query client behave the same on both backends.
 */
export function mapSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) return error

  const message =
    error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''

  for (const appCode of APP_ERROR_CODES) {
    if (message.startsWith(`${appCode}:`)) {
      return new AppError(appCode, message.slice(appCode.length + 1).trim())
    }
  }

  if (/invalid login credentials/i.test(message)) {
    return new AppError('INVALID_CREDENTIALS', 'Incorrect email or password.')
  }
  if (/email not confirmed/i.test(message)) {
    return new AppError('UNAUTHENTICATED', 'Please confirm your email before signing in.')
  }
  if (/user already registered|already exists/i.test(message)) {
    return new AppError('EMAIL_TAKEN', 'An account with this email already exists.')
  }
  if (/jwt|session|not authenticated/i.test(message)) {
    return new AppError('UNAUTHENTICATED', 'Please sign in to continue.')
  }
  if (code === 'PGRST116') {
    return new AppError('NOT_FOUND', 'Not found.')
  }
  if (code === '23505') {
    return new AppError('VALIDATION', 'That value is already taken.')
  }

  return new AppError(
    'VALIDATION',
    message || 'Something went wrong. Please try again.',
  )
}
