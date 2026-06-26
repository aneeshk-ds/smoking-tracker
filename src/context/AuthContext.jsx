// Auth + sync wiring. Provides the current user, sync status, and a guest flag
// to the whole app. When configured and signed in, it boots the sync engine.
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cloudEnabled } from '../lib/supabase'
import { watchAuth, describeUser, isReturningFromEmailLink, completeEmailSignIn } from '../lib/auth'
import { startSync } from '../lib/sync'
import { logError } from '../lib/logger'

const AuthContext = createContext({
  cloud: false,
  user: null,
  status: 'local', // 'local' | 'signed-out' | 'syncing' | 'synced' | 'error'
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const cloud = cloudEnabled()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(cloud ? 'signed-out' : 'local')
  const stopSyncRef = useRef(null)

  // Finish an email-link sign-in if we were redirected back into the app.
  useEffect(() => {
    if (!cloud) return
    if (isReturningFromEmailLink()) {
      completeEmailSignIn().catch((e) => console.warn('[auth] email link failed', e))
    }
  }, [cloud])

  useEffect(() => {
    if (!cloud) return
    const unsub = watchAuth(async (u) => {
      if (stopSyncRef.current) { stopSyncRef.current(); stopSyncRef.current = null }
      setUser(describeUser(u))
      if (u) {
        setStatus('syncing')
        try {
          stopSyncRef.current = await startSync(u.id, () => setStatus('synced'))
          setStatus('synced')
        } catch (e) {
          logError('auth.sync-start', e)
          setStatus('error')
        }
      } else {
        setStatus('signed-out')
      }
    })
    return () => {
      unsub && unsub()
      if (stopSyncRef.current) { stopSyncRef.current(); stopSyncRef.current = null }
    }
  }, [cloud])

  return (
    <AuthContext.Provider value={{ cloud, user, status }}>
      {children}
    </AuthContext.Provider>
  )
}
