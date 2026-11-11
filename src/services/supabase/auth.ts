import { readOfflineCache, writeOfflineCache } from '@/lib/offlineCache'
import type { User } from '@/types'
import { AppError } from '../errors'
import type { AuthService, SignUpInput } from '../types'
import { getSupabase } from './client'
import { mapSupabaseError } from './errors'

interface ProfileRow {
  id: string
  email: string
  full_name: string
  role: User['role']
  organizer_id: string | null
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function profileFor(userId: string): Promise<User> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, email, full_name, role, organizer_id')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()

  if (error) throw mapSupabaseError(error)
  if (!data) {
    throw new AppError('UNAUTHENTICATED', 'Your profile is not ready yet. Please try again.')
  }

  const user: User = {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    organizerId: data.organizer_id,
  }
  // Lets an offline reload restore the session without reaching Postgres.
  writeOfflineCache('profile', user)
  return user
}

export const supabaseAuthService: AuthService = {
  async getCurrentUser() {
    const supabase = getSupabase()

    // Offline: don't wait for a request that can't succeed. The saved profile
    // keeps the app usable (and the saved tickets reachable) without a signal.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return readOfflineCache<User>('profile')
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) throw mapSupabaseError(error)
    if (!data.session) return null

    try {
      return await profileFor(data.session.user.id)
    } catch {
      // Offline: a saved profile is enough to open the app and read the cached
      // tickets. It only counts if it belongs to the session's user.
      const cached = readOfflineCache<User>('profile')
      return cached?.id === data.session.user.id ? cached : null
    }
  },

  async signIn(email, password) {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    })
    if (error) throw mapSupabaseError(error)
    if (!data.user) throw new AppError('INVALID_CREDENTIALS', 'Incorrect email or password.')
    return profileFor(data.user.id)
  },

  async signUp(input: SignUpInput) {
    const email = normalizeEmail(input.email)
    const fullName = input.fullName.trim()

    if (!fullName) throw new AppError('VALIDATION', 'Please enter your name.')
    if (!email.includes('@')) throw new AppError('VALIDATION', 'Please enter a valid email.')
    if (input.password.length < 8) {
      throw new AppError('VALIDATION', 'Password must be at least 8 characters.')
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw mapSupabaseError(error)
    if (!data.user) throw new AppError('VALIDATION', 'Could not create your account.')

    // Local Supabase has confirmations off. Hosted projects that require email
    // confirmation have no session yet, so ask the user to confirm first.
    if (!data.session) {
      throw new AppError(
        'VALIDATION',
        'Check your email to confirm your account, then log in.',
      )
    }

    return profileFor(data.user.id)
  },

  async signOut() {
    const { error } = await getSupabase().auth.signOut()
    if (error) throw mapSupabaseError(error)
  },

  async sendMagicLink(email, redirectTo) {
    const { error } = await getSupabase().auth.signInWithOtp({
      email: normalizeEmail(email),
      options: {
        emailRedirectTo: redirectTo ?? window.location.origin,
      },
    })
    if (error) throw mapSupabaseError(error)
  },

  onAuthChange(callback) {
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        callback(null)
        return
      }
      void profileFor(session.user.id)
        .then(callback)
        .catch(() => callback(null))
    })
    return () => data.subscription.unsubscribe()
  },
}
