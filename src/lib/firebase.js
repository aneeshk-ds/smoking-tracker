// Lazy Firebase initialiser. Returns null handles when not configured, so the
// rest of the app can call cloudEnabled() and stay fully local otherwise.
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from './firebase-config'

let app = null
let auth = null
let db = null

export function cloudEnabled() {
  return isFirebaseConfigured()
}

export function getFirebase() {
  if (!isFirebaseConfigured()) return { app: null, auth: null, db: null }
  if (!app) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  }
  return { app, auth, db }
}
