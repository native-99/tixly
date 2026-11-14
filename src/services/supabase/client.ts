import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../errors'
import { mapSupabaseError } from './errors'

let client: SupabaseClient | null = null

/** Lazily created so builds and mock-mode tests don't need Supabase env vars. */
export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !publishableKey) {
    throw new AppError(
      'VALIDATION',
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.',
    )
  }

  client = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}

/** The signed-in user's id, used for columns RLS checks against auth.uid(). */
export async function requireUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser()
  if (error) throw mapSupabaseError(error)
  if (!data.user) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.')
  return data.user.id
}
