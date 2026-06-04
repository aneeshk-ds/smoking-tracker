// ---------------------------------------------------------------------------
// Firebase configuration.
//
// IMPORTANT: these values are NOT secrets. Firebase web config keys are meant
// to ship in client code. Access to data is controlled by Firestore security
// rules (see firestore.rules), not by hiding these keys.
//
// Until you paste real values here, the app runs in LOCAL-ONLY mode: it behaves
// exactly as before, fully on-device, with no accounts and no cloud sync. See
// FIREBASE_SETUP.md for how to create the project and fill this in.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

// True once the config has real values. Drives whether cloud features turn on.
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  )
}
