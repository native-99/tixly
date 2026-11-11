// Shared helpers for the payment and ticket-email Edge Functions.
// These run on the Supabase Edge Runtime (Deno) and are the only place the
// payment server key and the service-role key are used.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function handleOptions(request: Request): Response | null {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return null
}

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** A client that acts as the caller, so `auth.uid()` works inside RPCs. */
export function userClient(authorization: string): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY are not set')
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  })
}

export function appUrl(): string {
  // No trailing slash, so routes concatenate cleanly.
  return (Deno.env.get('APP_URL') ?? 'http://localhost:5173').replace(/\/+$/, '')
}

export function fromAddress(): { email: string; name: string } {
  return {
    email: Deno.env.get('TICKETS_EMAIL_FROM') ?? 'tickets@tixly.dev',
    name: Deno.env.get('TICKETS_EMAIL_FROM_NAME') ?? 'Tixly',
  }
}
