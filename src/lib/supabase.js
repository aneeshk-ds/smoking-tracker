// Lazy Supabase client. Returns null when not configured, so the rest of the
// app can call cloudEnabled() and stay fully local otherwise.
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig, isSupabaseConfigured } from './supabase-config'

let client = null

export function cloudEnabled() {
  return isSupabaseConfigured()
}

export function getSupabase() {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,   // completes OAuth + magic-link redirects
        flowType: 'pkce',
      },
    })
  }
  return client
}
