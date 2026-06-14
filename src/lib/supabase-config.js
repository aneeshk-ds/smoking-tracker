// ---------------------------------------------------------------------------
// Supabase configuration.
//
// The anon (public) key is meant to ship in client code. Data access is
// controlled by Row-Level Security policies (see supabase/schema.sql), NOT by
// hiding this key.
//
// Until you paste real values here (or set VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY at build time), the app runs in LOCAL-ONLY mode:
// fully on-device, no accounts, no cloud. See SUPABASE_SETUP.md.
// ---------------------------------------------------------------------------

export const supabaseConfig = {
  url:     import.meta.env.VITE_SUPABASE_URL     || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
}

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey)
}
