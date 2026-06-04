import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  startPhoneSignIn, confirmPhoneCode, startEmailSignIn, signOut, resetRecaptcha,
} from '../lib/auth'

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
          <div style={{ fontSize: 18 }}>{user.phone || user.email}</div>
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
      <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5, maxWidth: 440 }}>
        Add a phone number so your streaks and history survive a phone change. We only use it to
        sign you in. No password to remember.
      </p>

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
