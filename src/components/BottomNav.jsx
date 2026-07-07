import { NavLink } from 'react-router-dom'

// ── Cigarette-themed SVG icons ────────────────────────────────────────────────

// Home: cigarette with rising smoke wisps
const CigHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {/* Smoke wisps rising from lit end */}
    <path d="M5 11 Q4 9.5 5 8" strokeWidth="1.4" opacity="0.7" />
    <path d="M8 10 Q7 8.5 8 7" strokeWidth="1.4" opacity="0.5" />
    {/* Cigarette body */}
    <rect x="3" y="13" width="14" height="3" rx="1.5" fill={active ? 'currentColor' : 'none'} />
    {/* Filter (right) */}
    <rect x="17" y="13" width="4" height="3" rx="1" fill={active ? 'currentColor' : 'none'} />
    {/* Lit ember (left) */}
    <circle cx="3.5" cy="14.5" r="1" fill="currentColor" opacity="0.85" />
  </svg>
)

// History: cigarette lying beside list lines (log)
const CigHistory = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {/* Cigarette — small, upper right */}
    <rect x="13" y="4" width="8" height="2.5" rx="1.25" fill={active ? 'currentColor' : 'none'} />
    <rect x="13" y="4" width="2.5" height="2.5" rx="1" fill="currentColor" opacity="0.6" />
    <circle cx="21.2" cy="5.25" r="0.8" fill="currentColor" opacity="0.8" />
    {/* List lines */}
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="14" x2="21" y2="14" />
    <line x1="3" y1="19" x2="15" y2="19" />
  </svg>
)

// Journey: cigarette as a milestone marker / progress path
const CigJourney = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {/* Vertical cigarette — standing upright like a milestone */}
    <rect x="10" y="5" width="4" height="12" rx="2" fill={active ? 'currentColor' : 'none'} />
    {/* Filter cap at bottom */}
    <rect x="10" y="15" width="4" height="3" rx="1" opacity="0.6"
      fill={active ? 'currentColor' : 'none'} />
    {/* Lit ember at top */}
    <circle cx="12" cy="4.2" r="1.1" fill="currentColor" opacity="0.85" />
    {/* Small smoke */}
    <path d="M12 3 Q11.2 1.8 12 0.8" strokeWidth="1.2" opacity="0.5" />
    {/* Base ground line */}
    <line x1="6" y1="20" x2="18" y2="20" strokeWidth="1.5" opacity="0.5" />
  </svg>
)

// Insights: stays as waveform / chart — data doesn't need cig theming
const InsightsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

// Settings: stays as gear
const SettingsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV = [
  { to: '/',         label: 'Home',     Icon: CigHome },
  { to: '/history',  label: 'History',  Icon: CigHistory },
  { to: '/journey',  label: 'Journey',  Icon: CigJourney },
  { to: '/insights', label: 'Insights', Icon: InsightsIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

export default function BottomNav() {
  return (
    <nav
      data-tour="nav"
      className="fixed bottom-0 left-0 right-0 z-50 flex safe-bottom"
      style={{
        background: 'rgba(13,20,32,0.94)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--dim)',
          })}
          className="flex flex-col items-center justify-center flex-1 py-2 gap-1 min-h-[56px] transition-colors duration-200"
        >
          {({ isActive }) => (
            <>
              <item.Icon active={isActive} />
              <span
                className="text-[10px] tracking-wide"
                style={{ fontWeight: isActive ? 700 : 400 }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
