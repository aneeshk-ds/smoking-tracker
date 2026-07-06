// ---------------------------------------------------------------------------
// Supabase configuration.
//
// The project URL and the *publishable* (anon) key are PUBLIC by design — they
// ship in the client bundle and are safe to expose. Data access is controlled
// by Row-Level Security (see supabase/schema.sql), NOT by hiding these values.
//
// Local dev / CI may override via env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
// ---------------------------------------------------------------------------

export const supabaseConfig = {
  url:     import.meta.env.VITE_SUPABASE_URL     || 'https://myxbpoxxudjblogxwfax.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xNJmMhg-7mfIk_s0z0tQXA_UmUzWfLC',
}

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey)
}
