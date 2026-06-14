import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  startPhoneSignIn, confirmPhoneCode, startEmailSignIn, signOut, resetRecaptcha,
  signInWithGoogle, signInWithApple,
} from '../lib/auth'

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function AppleGlyph() {
  return (
    <svg width="16" height="18" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
      <path d="M17.05 12.5c-.03-2.5 2.04-3.7 2.13-3.76-1.16-1.7-2.97-1.93-3.61-1.96-1.54-.16-3 .9-3.78.9-.78 0-1.98-.88-3.26-.85-1.68.02-3.23.97-4.09 2.47-1.74 3.02-.45 7.5 1.25 9.95.83 1.2 1.82 2.55 3.12 2.5 1.25-.05 1.72-.81 3.23-.81 1.51 0 1.93.81 3.26.78 1.35-.02 2.2-1.22 3.02-2.43.95-1.39 1.34-2.74 1.36-2.81-.03-.01-2.61-1-2.64-3.97zM14.6 4.97c.69-.83 1.15-1.99 1.02-3.14-.99.04-2.18.66-2.89 1.49-.64.73-1.2 1.9-1.05 3.02 1.1.09 2.23-.56 2.92-1.37z"/>
    </svg>
  )
}

const socialBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  borderRadius: 12, padding: '13px 16px', fontSize: 15, fontWeight: 600,
  width: '100%', cursor: 'pointer',
}
const googleBtn = { ...socialBtn, background: '#FFFFFF', color: '#1F1F1F', border: '1px solid #DADCE0' }
const appleBtn = { ...socialBtn, background: '#000000', color: '#FFFFFF', border: '1px solid #000000' }
const orRow = { display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0', color: 'var(--dim)', fontSize: 12 }
const orLine = { flex: 1, height: 1, background: 'var(--border)' }

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
}

function Field({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
}

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text)',
  padding: '14px 16px',
  fontSize: 16,
  outline: 'none',
  width: '100%',
}

const btnPrimary = {
  background: 'var(--accent)',
  color: '#0D1420',
  border: 'none',
  borderRadius: 12,
  padding: '14px 16px',
  fontSize: 16,
  fontWeight: 600,
  width: '100%',
  cursor: 'pointer',
}

const btnGhost = {
  background: 'transparent',
  color: 'var(--muted)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 15,
  width: '100%',
  cursor: 'pointer',
}

export default function Account() {
  const navigate = useNavigate()
  const { cloud, user, status } = useAuth()

  const [mode, setMode] = useState('phone')      // 'phone' | 'email'
  const [cc, setCc] = useState('+91')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [code, setCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendCode() {
    setError(''); setBusy(true)
    try {
      const e164 = `${cc}${phone}`.replace(/\s+/g, '')
      const conf = await startPhoneSignIn(e164)
      setConfirmation(conf)
    } catch (e) {
      setError(e?.message || 'Could not send the code. Check the number and try again.')
      resetRecaptcha()
    } finally { setBusy(false) }
  }

  async function verifyCode() {
    setError(''); setBusy(true)
    try {
      await confirmPhoneCode(confirmation, code.trim())
      navigate('/')
    } catch (e) {
      setError(e?.message || 'That code did not match. Try again.')
    } finally { setBusy(false) }
  }

  async function sendEmail() {
    setError(''); setBusy(true)
    try {
      await startEmailSignIn(email.trim())
      setEmailSent(true)
    } catch (e) {
      setError(e?.message || 'Could not send the sign-in link.')
    } finally { setBusy(false) }
  }

  async function oauth(fn) {
    setError(''); setBusy(true)
    try {
      await fn()
      navigate('/')
    } catch (e) {
      const code = e?.code || ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user dismissed the popup — no error to show
      } else {
        setError(e?.message || 'Sign-in failed. Please try again.')
      }
    } finally { setBusy(false) }
  }

  const wrap = { minHeight: '100%', background: 'var(--bg)', color: 'var(--text)', padding: '28px 20px 48px' }

  // Cloud not configured yet -> local-only explainer
  if (!cloud) {
    return (
      <div style={wrap}>
        <button onClick={() => navigate(-1)} style={{ ...btnGhost, width: 'auto', marginBottom: 20 }}>Back</button>
        <h1 className="heading-lg" style={{ fontSize: 26, marginBottom: 12 }}>Backup not set up yet</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.55, maxWidth: 440 }}>
          This build runs fully on your device. Cloud backup and accounts turn on once Firebase
          is configured. Until then your data lives only on this phone, so avoid clearing the
          browser or reinstalling without an export first.
        </p>
      </div>
    )
  }

  // Signed in
  if (user) {
    return (
      <div style={wrap}>
        <button onClick={() => navigate(-1)} style={{ ...btnGhost, width: 'auto', marginBottom: 20 }}>Back</button>
        <h1 className="heading-lg" style={{ fontSize: 26, marginBottom: 6 }}>Your account</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Backup is on. Your data is safe if you change phones.</p>
        <div style={{ ...card, padding: 18, marginBottom: 16 }}>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>Signed in via {user.method}</div>
          <div style={{ fontSize: 18 }}>{user.name || user.phone || user.email}</div>
          <div style={{ marginTop: 12, fontSize: 13, color: status === 'synced' ? 'var(--success)' : 'var(--muted)' }}>
            {status === 'synced' ? 'All changes synced' : status === 'syncing' ? 'Syncing...' : status === 'error' ? 'Sync error - will retry' : ''}
          </div>
        </div>
        <button onClick={async () => { await signOut(); }} style={btnGhost}>Sign out</button>
        <p style={{ color: 'var(--dim)', fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
          Signing out keeps your data on this device. It stops syncing until you sign in again.
        </p>
      </div>
    )
  }

  // Signed out -> phone-first sign in
  return (
    <div style={wrap}>
      <button onClick={() => navigate(-1)} style={{ ...btnGhost, width: 'auto', marginBottom: 20 }}>Back</button>
      <h1 className="heading-lg" style={{ fontSize: 26, marginBottom: 6 }}>Save your progress</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 18, lineHeight: 1.5, maxWidth: 440 }}>
        Sign in so your streaks and history survive a phone change. Pick whichever is easiest —
        no password to remember.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => oauth(signInWithGoogle)} disabled={busy} style={{ ...googleBtn, opacity: busy ? 0.6 : 1 }}>
          <GoogleGlyph /> Continue with Google
        </button>
        <button onClick={() => oauth(signInWithApple)} disabled={busy} style={{ ...appleBtn, opacity: busy ? 0.6 : 1 }}>
          <AppleGlyph /> Continue with Apple
        </button>
      </div>

      <div style={orRow}><span style={orLine} />or<span style={orLine} /></div>

      {mode === 'phone' && !confirmation && (
        <div style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field>
            <label style={{ color: 'var(--muted)', fontSize: 13 }}>Phone number</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={cc} onChange={(e) => setCc(e.target.value)} style={{ ...inputStyle, width: 76, textAlign: 'center' }} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="98765 43210" style={inputStyle} />
            </div>
          </Field>
          <button onClick={sendCode} disabled={busy || !phone} style={{ ...btnPrimary, opacity: busy || !phone ? 0.5 : 1 }}>
            {busy ? 'Sending...' : 'Send code'}
          </button>
          <button onClick={() => setMode('email')} style={btnGhost}>Use email instead</button>
        </div>
      )}

      {mode === 'phone' && confirmation && (
        <div style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field>
            <label style={{ color: 'var(--muted)', fontSize: 13 }}>Enter the 6-digit code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123456" style={{ ...inputStyle, letterSpacing: 6, textAlign: 'center', fontSize: 22 }} />
          </Field>
          <button onClick={verifyCode} disabled={busy || code.length < 6} style={{ ...btnPrimary, opacity: busy || code.length < 6 ? 0.5 : 1 }}>
            {busy ? 'Verifying...' : 'Verify'}
          </button>
          <button onClick={() => { setConfirmation(null); setCode(''); resetRecaptcha() }} style={btnGhost}>Use a different number</button>
        </div>
      )}

      {mode === 'email' && (
        <div style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {emailSent ? (
            <p style={{ color: 'var(--text)', lineHeight: 1.5 }}>
              Check your inbox. Open the link on this device to finish signing in.
            </p>
          ) : (
            <>
              <Field>
                <label style={{ color: 'var(--muted)', fontSize: 13 }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={inputStyle} />
              </Field>
              <button onClick={sendEmail} disabled={busy || !email} style={{ ...btnPrimary, opacity: busy || !email ? 0.5 : 1 }}>
                {busy ? 'Sending...' : 'Send sign-in link'}
              </button>
            </>
          )}
          <button onClick={() => { setMode('phone'); setEmailSent(false) }} style={btnGhost}>Use phone instead</button>
        </div>
      )}

      {error && <p style={{ color: 'var(--danger)', marginTop: 14, fontSize: 14 }}>{error}</p>}

      <button onClick={() => navigate('/')} style={{ ...btnGhost, marginTop: 16 }}>Continue as guest</button>
      <p style={{ color: 'var(--dim)', fontSize: 12, marginTop: 16, lineHeight: 1.5, maxWidth: 440 }}>
        As a guest your data stays on this device only and is not backed up. We explain what we
        store on the <span onClick={() => navigate('/privacy')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>privacy page</span>.
      </p>

      {/* Invisible reCAPTCHA mounts here for phone sign-in */}
      <div id="recaptcha-container" />
    </div>
  )
}
