import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSettings } from './lib/storage'
import Home      from './routes/Home'
import Onboarding from './routes/Onboarding'
import Insights  from './routes/Insights'
import Health    from './routes/Health'
import Settings  from './routes/Settings'
import Log       from './routes/Log'
import History   from './routes/History'
import Journey   from './routes/Journey'

export default function App() {
  const [onboarded, setOnboarded] = useState(null)

  useEffect(() => {
    getSettings().then((s) => {
      setOnboarded(!!s?.onboardedAt)
    })
  }, [])

  if (onboarded === null) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg)' }}>
        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={onboarded ? <Home /> : <Navigate to="/onboarding" replace />}
        />
        <Route
          path="/onboarding"
          element={onboarded ? <Navigate to="/" replace /> : <Onboarding onComplete={() => setOnboarded(true)} />}
        />
        <Route path="/history"  element={<History />} />
        <Route path="/journey"  element={<Journey />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/health"   element={<Health />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/log"      element={<Log />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
