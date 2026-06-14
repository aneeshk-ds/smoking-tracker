// Authentication on Supabase. Methods:
//   - Google / Apple (iCloud)  -> OAuth redirect
//   - Phone OTP                -> SMS one-time code
//   - Email magic link         -> passwordless link
//   - Guest                    -> no sign-in, fully local
//
// Signing in for the first time upgrades a guest: their local data is pushed
// to the cloud by the sync engine right after the session appears.
import { getSupabase, cloudEnabled } from './supabase'

export function authAvailable() {
  return cloudEnabled()
}

// Where OAuth / magic-link redirects land back. Keeps the app's base path.
function redirectTo() {
  return window.location.origin + window.location.pathname
}

// Subscribe to auth state. Calls cb(user|null). Returns an unsubscribe fn.
export function watchAuth(cb) {
  const sb = getSupabase()
  if (!sb) { cb(null); return () => {} }

  // Emit the current session immediately, then on every change.
  sb.auth.getSession().then(({ data }) => cb(data?.session?.user ?? null))
  const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null)
  })
  return () => { try { sub?.subscription?.unsubscribe() } catch { /* ignore */ } }
}

// ---- OAuth providers (Google, Apple) ----

export async function signInWithGoogle() {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud is not configured')
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo() },
  })
  if (error) throw error
  // Browser redirects to Google; resolves as the page navigates away.
}

export async function signInWithApple() {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud is not configured')
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: redirectTo() },
  })
  if (error) throw error
}

// ---- Phone (SMS OTP) ----

// phoneE164 must look like +919876543210. Returns the phone (the "confirmation"
// handle the UI passes back to confirmPhoneCode).
export async function startPhoneSignIn(phoneE164) {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud is not configured')
  const { error } = await sb.auth.signInWithOtp({ phone: phoneE164 })
  if (error) throw error
  return phoneE164
}

export async function confirmPhoneCode(phoneE164, code) {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud is not configured')
  const { data, error } = await sb.auth.verifyOtp({
    phone: phoneE164, token: code, type: 'sms',
  })
  if (error) throw error
  return data.user
}

// ---- Email magic link (passwordless) ----

export async function startEmailSignIn(email) {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud is not configured')
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo() },
  })
  if (error) throw error
}

// Supabase auto-detects the returning session (detectSessionInUrl), so these
// are no-ops kept for API compatibility with the rest of the app.
export function isReturningFromEmailLink() { return false }
export async function completeEmailSignIn() { /* handled automatically */ }

// reCAPTCHA was a Firebase-phone requirement; Supabase does not need it.
export function resetRecaptcha() { /* no-op */ }

// ---- Sign out ----

export async function signOut() {
  const sb = getSupabase()
  if (sb) await sb.auth.signOut()
}

// ---- Helpers ----

export function describeUser(user) {
  if (!user) return null
  const provider = user.app_metadata?.provider || ''
  const method =
    provider === 'google' ? 'google'
    : provider === 'apple' ? 'apple'
    : user.phone ? 'phone'
    : user.email ? 'email'
    : 'unknown'
  const meta = user.user_metadata || {}
  return {
    uid: user.id,
    phone: user.phone ? `+${user.phone}` : null,
    email: user.email ?? null,
    name: meta.full_name || meta.name || null,
    method,
  }
}
