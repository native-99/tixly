import { clone, delay, getDb, newId, saveDb, setSessionUserId } from '@/mocks/db'
import type { User } from '@/types'
import { AppError } from '../errors'
import type { AuthService, SignUpInput } from '../types'
import { requireUser } from './shared'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export const mockAuthService: AuthService = {
  async getCurrentUser() {
    await delay(150)
    try {
      return clone(requireUser())
    } catch {
      return null
    }
  },

  async signIn(email, password) {
    await delay()
    const user = getDb().users.find(
      (candidate) => candidate.email === normalizeEmail(email) && candidate.password === password,
    )
    // An empty password never matches, even for accounts without one.
    if (!user || !password) {
      throw new AppError('INVALID_CREDENTIALS', 'Incorrect email or password.')
    }
    setSessionUserId(user.id)
    return clone(requireUser())
  },

  async signUp(input: SignUpInput) {
    await delay()
    const email = normalizeEmail(input.email)
    const fullName = input.fullName.trim()

    if (!fullName) throw new AppError('VALIDATION', 'Please enter your name.')
    if (!email.includes('@')) throw new AppError('VALIDATION', 'Please enter a valid email.')
    if (input.password.length < 8) {
      throw new AppError('VALIDATION', 'Password must be at least 8 characters.')
    }

    const db = getDb()
    if (db.users.some((user) => user.email === email)) {
      throw new AppError('EMAIL_TAKEN', 'An account with this email already exists.')
    }

    const user: User = { id: newId('usr'), email, fullName, role: 'buyer', organizerId: null }
    db.users.push({ ...user, password: input.password })
    saveDb()
    setSessionUserId(user.id)
    return clone(user)
  },

  async signOut() {
    await delay(150)
    setSessionUserId(null)
  },
}
