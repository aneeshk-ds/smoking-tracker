// Offline-first sync between local Dexie and Firestore.
//
// Model:
//   users/{uid}                      -> settings document (+ updatedAt)
//   users/{uid}/cigarettes/{id}      -> one doc per cigarette (+ updatedAt,
//                                       deleted:true acts as a tombstone)
//
// Strategy: last-write-wins by updatedAt. A guest who signs in for the first
// time simply has no remote data yet, so reconcile() pushes all their local
// rows up. That is the guest -> account migration.

import {
  doc, getDoc, setDoc, collection, getDocs, writeBatch, onSnapshot,
} from 'firebase/firestore'
import { getFirebase } from './firebase'
import {
  getSyncSnapshot, applyRemoteCigarettes, applyRemoteDeletes, applyRemoteSettings,
  clearTombstones, onLocalChange,
} from './storage'

const BATCH_LIMIT = 400

function userDoc(db, uid) { return doc(db, 'users', uid) }
function cigCol(db, uid) { return collection(db, 'users', uid, 'cigarettes') }

// Firestore rejects undefined and non-serialisable values. Round-trip to drop
// them (also strips any leftover browser handles or functions).
function clean(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function stripMeta(row) {
  const { deleted, ...rest } = row
  return rest
}

// ---- Full two-way reconcile ----

export async function reconcile(uid) {
  const { db } = getFirebase()
  if (!db || !uid) return

  // Read remote cigarettes + settings
  const remote = new Map()
  const remoteSnap = await getDocs(cigCol(db, uid))
  remoteSnap.forEach((d) => remote.set(d.id, d.data()))
  const remoteSettingsSnap = await getDoc(userDoc(db, uid))
  const remoteSettings = remoteSettingsSnap.exists() ? remoteSettingsSnap.data() : null

  // Read local
  const { cigarettes, settings, tombstones } = await getSyncSnapshot()
  const localById = new Map(cigarettes.map((c) => [c.id, c]))
  const tombById = new Map(tombstones.map((t) => [t.id, t]))

  const toLocalUpsert = []
  const toLocalDelete = []
  const toRemoteUpsert = []
  const toRemoteDelete = []

  const ids = new Set([...localById.keys(), ...remote.keys(), ...tombById.keys()])
  for (const id of ids) {
    const local = localById.get(id)
    const tomb = tombById.get(id)
    const rem = remote.get(id)
    const localTime = local?.updatedAt ?? local?.createdAt ?? 0
    const tombTime = tomb?.deletedAt ?? 0
    const remTime = rem?.updatedAt ?? 0
    const remDeleted = rem?.deleted === true

    // Local delete wins
    if (tomb && tombTime >= remTime && tombTime >= localTime) {
      if (!remDeleted) toRemoteDelete.push(id)
      continue
    }
    // Remote delete wins
    if (remDeleted && remTime >= localTime && remTime >= tombTime) {
      if (local) toLocalDelete.push(id)
      continue
    }
    // Both live -> newer wins
    if (local && rem && !remDeleted) {
      if (localTime > remTime) toRemoteUpsert.push(local)
      else if (remTime > localTime) toLocalUpsert.push(stripMeta({ id, ...rem }))
      continue
    }
    if (local && !rem) { toRemoteUpsert.push(local); continue }
    if (!local && rem && !remDeleted) { toLocalUpsert.push(stripMeta({ id, ...rem })); continue }
  }

  // Apply locally
  await applyRemoteCigarettes(toLocalUpsert)
  await applyRemoteDeletes(toLocalDelete)

  // Settings LWW
  const localSettingsTime = settings?.updatedAt ?? 0
  const remoteSettingsTime = remoteSettings?.updatedAt ?? 0
  if (remoteSettings && remoteSettingsTime > localSettingsTime) {
    await applyRemoteSettings(remoteSettings)
  }

  // Push to remote
  await pushBatches(db, uid, toRemoteUpsert, toRemoteDelete)
  if (settings && (!remoteSettings || localSettingsTime >= remoteSettingsTime)) {
    await setDoc(userDoc(db, uid), clean({ ...settings, updatedAt: localSettingsTime || Date.now() }), { merge: true })
  }

  // Local tombstones that are now reflected remotely can be dropped
  await clearTombstones(toRemoteDelete)
}

async function pushBatches(db, uid, upserts, deletes) {
  const ops = []
  for (const row of upserts) {
    ops.push([row.id, clean({ ...row, updatedAt: row.updatedAt ?? Date.now(), deleted: false })])
  }
  for (const id of deletes) {
    ops.push([id, { deleted: true, updatedAt: Date.now() }])
  }
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const chunk = ops.slice(i, i + BATCH_LIMIT)
    const batch = writeBatch(db)
    for (const [id, data] of chunk) {
      batch.set(doc(cigCol(db, uid), id), data, { merge: true })
    }
    await batch.commit()
  }
}

// ---- Realtime subscription (remote -> local) ----

export function subscribeRemote(uid, onApplied) {
  const { db } = getFirebase()
  if (!db || !uid) return () => {}

  const unsubCigs = onSnapshot(cigCol(db, uid), (snap) => {
    const upserts = []
    const deletes = []
    snap.docChanges().forEach((ch) => {
      if (ch.type === 'removed') return
      const data = ch.doc.data()
      if (data.deleted) deletes.push(ch.doc.id)
      else upserts.push(stripMeta({ id: ch.doc.id, ...data }))
    })
    Promise.all([applyRemoteCigarettes(upserts), applyRemoteDeletes(deletes)])
      .then(() => onApplied && onApplied())
      .catch((e) => console.warn('[sync] remote apply failed', e))
  }, (e) => console.warn('[sync] cig subscription error', e))

  const unsubSettings = onSnapshot(userDoc(db, uid), (snap) => {
    if (!snap.exists()) return
    applyRemoteSettings(snap.data())
      .then(() => onApplied && onApplied())
      .catch((e) => console.warn('[sync] settings apply failed', e))
  }, (e) => console.warn('[sync] settings subscription error', e))

  return () => { unsubCigs(); unsubSettings() }
}

// ---- Local -> remote (debounced) ----

export function startLocalPush(uid, onPushed) {
  const { db } = getFirebase()
  if (!db || !uid) return () => {}
  let timer = null
  const stop = onLocalChange(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      reconcile(uid)
        .then(() => onPushed && onPushed())
        .catch((e) => console.warn('[sync] push failed', e))
    }, 1500)
  })
  return () => { stop(); clearTimeout(timer) }
}

// ---- Top-level orchestration ----

export async function startSync(uid, onUpdate) {
  await reconcile(uid)               // initial merge + guest migration
  const stopSub = subscribeRemote(uid, onUpdate)
  const stopPush = startLocalPush(uid, onUpdate)
  return () => { stopSub(); stopPush() }
}
