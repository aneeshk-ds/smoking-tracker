import { useNavigate } from 'react-router-dom'

const H = ({ children }) => (
  <h2 className="heading-md" style={{ fontSize: 18, marginTop: 26, marginBottom: 8 }}>{children}</h2>
)
const P = ({ children }) => (
  <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>{children}</p>
)

export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', color: 'var(--text)', padding: '28px 20px 64px', maxWidth: 560, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, cursor: 'pointer' }}
      >Back</button>

      <h1 className="heading-lg" style={{ fontSize: 26, marginBottom: 6 }}>Privacy</h1>
      <P>Last updated June 2026. This app helps you track and reduce smoking. This page explains what it stores and where.</P>

      <H>Guest mode (default)</H>
      <P>When you first open the app you are a guest. Everything you log stays on your device, inside the browser, and is never sent anywhere. Nothing is backed up. If you lose or reset the device, guest data is gone.</P>

      <H>When you create an account</H>
      <P>To keep your data safe across phone changes, you can sign in with a phone number (default) or email. At that point your logs and settings are copied to a private cloud space tied to your account, hosted on Google Firebase, and kept in sync across your devices.</P>

      <H>What we store</H>
      <P>Your cigarette log entries (time, brand, cost, and any optional notes such as mood or trigger you add), your goal and target, your brand and price settings, and the sign-in identifier you choose: a phone number or an email address.</P>

      <H>What we do not do</H>
      <P>We do not sell your data. We do not show ads. We do not share your data with third parties for marketing. The phone number or email is used only to sign you in and sync your data.</P>

      <H>Phone number and SMS</H>
      <P>If you sign in by phone, a one-time code is sent by SMS through Firebase Authentication to confirm the number is yours. The number is stored only as your account identifier.</P>

      <H>Security</H>
      <P>Data in transit is encrypted (HTTPS). Data at rest is encrypted on Google's servers. Access rules ensure only your signed-in account can read or write your data.</P>

      <H>Deleting your data</H>
      <P>You can erase everything from Settings using Delete all data, which clears the device and your cloud copy. Removing your account removes the cloud copy permanently.</P>

      <H>Contact</H>
      <P>For any data request, contact the address listed in the app store entry or repository.</P>
    </div>
  )
}
