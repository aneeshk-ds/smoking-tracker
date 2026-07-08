// Offline-first sync between local Dexie and Supabase (Postgres + Realtime).
//
// Model:
//   public.cigarettes  -> one row per cigarette { id, user_id, data, updated_at, deleted }
//   public.settings    -> one row per user      { user_id, data, updated_at }
//
// Strategy: last-write-wins by updated_at (epoch ms). A guest who signs in for
// the first time has no remote rows, so reconcile() pushes everything up — that
// is the guest -> account migration. The local Dexie helpers are reused as-is.
import { getSupabase } from './supabase'
import { logError } from './logger'
import {
  getSyncSnapshot, applyRemoteCigarettes, applyRemoteDeletes, applyRemoteSettings,
  clearTombstones, onLocalChange,
} from './storage'

const UPSERT_LIMIT = 400

// Supabase/Postgres rejects undefined. Round-trip to drop them and strip any
// leftover browser handles or functions.
function clean(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Turn a remote cigarette row into a plain local record.
function remoteToRecord(row) {
  return { id: row.id, ...(row.data || {}), updatedAt: row.updated_at }
}

// ---- Full two-way reconcile ----

export async function reconcile(uid) {
  const sb = getSupabase()
  if (!sb || !uid) return

  // Read remote
  const remote = new Map()
  const { data: remoteRows, error: cigErr } = await sb
    .from('cigarettes').select('id,data,updated_at,deleted').eq('user_id', uid)
  if (cigErr) throw cigErr
  for (const row of remoteRows || []) remote.set(row.id, row)

  const { data: remoteSettingsRow, error: setErr } = await sb
    .from('settings').select('data,updated_at').eq('user_id', uid).maybeSingle()
  if (setErr) throw setErr
  const remoteSettings = remoteSettingsRow
    ? { ...(remoteSettingsRow.data || {}), updatedAt: remoteSettingsRow.updated_at }
    : null

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
    const remTime = rem?.updated_at ?? 0
    const remDeleted = rem?.deleted === true

    if (tomb && tombTime >= remTime && tombTime >= localTime) {
      if (!remDeleted) toRemoteDelete.push(id)
      continue
    }
    if (remDeleted && remTime >= localTime && remTime >= tombTime) {
      if (local) toLocalDelete.push(id)
      continue
    }
    if (local && rem && !remDeleted) {
      if (localTime > remTime) toRemoteUpsert.push(local)
      else if (remTime > localTime) toLocalUpsert.push(remoteToRecord(rem))
      continue
    }
    if (local && !rem) { toRemoteUpsert.push(local); continue }
    if (!local && rem && !remDeleted) { toLocalUpsert.push(remoteToRecord(rem)); continue }
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
  await pushRows(sb, uid, toRemoteUpsert, toRemoteDelete)
  if (settings && (!remoteSettings || localSettingsTime >= remoteSettingsTime)) {
    const { error } = await sb.from('settings').upsert(
      { user_id: uid, data: clean(settings), updated_at: localSettingsTime || Date.now() },
      { onConflict: 'user_id' },
    )
    if (error) throw error
  }

  // Tombstones now reflected remotely can be dropped
  await clearTombstones(toRemoteDelete)
}

async function pushRows(sb, uid, upserts, deletes) {
  const rows = []
  for (const rec of upserts) {
    rows.push({
      id: rec.id, user_id: uid, data: clean(rec),
      updated_at: rec.updatedAt ?? Date.now(), deleted: false,
    })
  }
  for (const id of deletes) {
    rows.push({ id, user_id: uid, data: {}, updated_at: Date.now(), deleted: true })
  }
  for (let i = 0; i < rows.length; i += UPSERT_LIMIT) {
    const chunk = rows.slice(i, i + UPSERT_LIMIT)
    const { error } = await sb.from('cigarettes').upsert(chunk, { onConflict: 'id' })
    if (error) throw error
  }
}

// ---- Realtime subscription (remote -> local) ----

export function subscribeRemote(uid, onApplied) {
  const sb = getSupabase()
  if (!sb || !uid) return () => {}

  // Tear down any stale channel for this user, then use a unique channel name so
  // repeated subscribe attempts never collide ("callbacks after subscribe()").
  try {
    for (const ch of sb.getChannels()) {
      if (typeof ch.topic === 'string' && ch.topic.includes(`sync:${uid}`)) sb.removeChannel(ch)
    }
  } catch { /* ignore */ }

  const channel = sb
    .channel(`sync:${uid}:${Date.now()}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'cigarettes', filter: `user_id=eq.${uid}` },
      (payload) => {
        const row = payload.new
        if (!row) return
        const apply = row.deleted
          ? applyRemoteDeletes([row.id])
          : applyRemoteCigarettes([remoteToRecord(row)])
        apply.then(() => onApplied && onApplied())
          .catch((e) => logError('sync.remote-cig', e))
      })
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${uid}` },
      (payload) => {
        const row = payload.new
        if (!row) return
        applyRemoteSettings({ ...(row.data || {}), updatedAt: row.updated_at })
          .then(() => onApplied && onApplied())
          .catch((e) => logError('sync.remote-settings', e))
      })
    .subscribe()

  return () => { try { sb.removeChannel(channel) } catch { /* ignore */ } }
}

// ---- Local -> remote (debounced) ----

export function startLocalPush(uid, onPushed) {
  const sb = getSupabase()
  if (!sb || !uid) return () => {}
  let timer = null
  const stop = onLocalChange(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      reconcile(uid)
        .then(() => onPushed && onPushed())
        .catch((e) => logError('sync.push', e))
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
