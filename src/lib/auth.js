// Authentication: phone OTP (primary, Telegram-style), email link (fallback),
// and guest mode (no sign-in at all, fully local). Account creation upgrades a
// guest by signing them in for the first time; their local data is migrated to
// the cloud by the sync engine right after sign-in.

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut as fbSignOut,
} from 'firebase/auth'
import { getFirebase, cloudEnabled } from './firebase'

const EMAIL_KEY = 'st_email_for_signin'

export function authAvailable() {
  return cloudEnabled()
}

// Subscribe to auth state. Calls cb(user|null). Returns an unsubscribe fn.
export function watchAuth(cb) {
  const { auth } = getFirebase()
  if (!auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, cb)
}

// ---- Phone (primary) ----

let recaptcha = null

export function initRecaptcha(containerId = 'recaptcha-container') {
  const { auth } = getFirebase()
  if (!auth) throw new Error('Cloud is not configured')
  if (recaptcha) return recaptcha
  // Invisible reCAPTCHA: solves silently for most users.
  recaptcha = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
  return recaptcha
}

export function resetRecaptcha() {
  try {
    if (recaptcha) recaptcha.clear()
  } catch { /* ignore */ }
  recaptcha = null
}

// phoneE164 must be like +919876543210. Returns a confirmation handle.
export async function startPhoneSignIn(phoneE164) {
  const { auth } = getFirebase()
  if (!auth) throw new Error('Cloud is not configured')
  const verifier = initRecaptcha()
  return signInWithPhoneNumber(auth, phoneE164, verifier)
}

export async function confirmPhoneCode(confirmation, code) {
  const result = await confirmation.confirm(code)
  return result.user
}

// ---- Email link (fallback, passwordless) ----

export async function startEmailSignIn(email) {
  const { auth } = getFirebase()
  if (!auth) throw new Error('Cloud is not configured')
  const actionCodeSettings = {
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true,
  }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
  window.localStorage.setItem(EMAIL_KEY, email)
}

export function isReturningFromEmailLink() {
  const { auth } = getFirebase()
  if (!auth) return false
  return isSignInWithEmailLink(auth, window.location.href)
}

export async function completeEmailSignIn() {
  const { auth } = getFirebase()
  if (!auth) throw new Error('Cloud is not configured')
  let email = window.localStorage.getItem(EMAIL_KEY)
  if (!email) email = window.prompt('Confirm the email you used to sign in')
  if (!email) throw new Error('Email required to finish sign-in')
  const result = await signInWithEmailLink(auth, email, window.location.href)
  window.localStorage.removeItem(EMAIL_KEY)
  // Strip the sign-in params from the URL so a refresh does not re-trigger it.
  window.history.replaceState(null, '', window.location.origin + window.location.pathname)
  return result.user
}

// ---- Sign out ----

export async function signOut() {
  const { auth } = getFirebase()
  if (auth) await fbSignOut(auth)
  resetRecaptcha()
}

// ---- Helpers ----

export function describeUser(user) {
  if (!user) return null
  return {
    uid: user.uid,
    phone: user.phoneNumber ?? null,
    email: user.email ?? null,
    method: user.phoneNumber ? 'phone' : user.email ? 'email' : 'unknown',
  }
}
