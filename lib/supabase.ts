// @/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Create a singleton instance to avoid multiple client warnings
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    )
  }
  return supabaseClient
}

// Server-side client with service role
let supabaseServerClient: ReturnType<typeof createClient> | null = null

export function getSupabaseServerClient() {
  if (!supabaseServerClient) {
    supabaseServerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )
  }
  return supabaseServerClient
}