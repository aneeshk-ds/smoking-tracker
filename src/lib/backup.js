// Auto-backup using the File System Access API.
// The user picks a folder once; the handle is persisted in IndexedDB.
// Subsequent backups write silently to that folder.

import { exportAllAsJSON } from './storage'
import { updateSettings, getSettings } from './storage'

export function isFSASupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function pickBackupFolder() {
  if (!isFSASupported()) throw new Error('File System Access API not supported in this browser.')
  const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' })
  await updateSettings({ backupDirHandle: handle, backupEnabled: true, lastBackupAt: null })
  return handle
}

export async function disableBackup() {
  await updateSettings({ backupEnabled: false, backupDirHandle: null, lastBackupAt: null })
}

async function ensurePermission(handle) {
  const perm = await handle.queryPermission({ mode: 'readwrite' })
  if (perm === 'granted') return true
  const req = await handle.requestPermission({ mode: 'readwrite' })
  return req === 'granted'
}

export async function performBackup(force = false) {
  const settings = await getSettings()
  if (!settings?.backupEnabled || !settings?.backupDirHandle) return false

  // Don't backup more than once per hour unless forced
  if (!force && settings.lastBackupAt) {
    const hourAgo = Date.now() - 60 * 60 * 1000
    if (settings.lastBackupAt > hourAgo) return false
  }

  try {
    const handle = settings.backupDirHandle
    const ok = await ensurePermission(handle)
    if (!ok) return false

    const json = await exportAllAsJSON()
    const date = new Date().toISOString().split('T')[0]
    const fileHandle = await handle.getFileHandle(
      `smoking-tracker-${date}.json`,
      { create: true }
    )
    const writable = await fileHandle.createWritable()
    await writable.write(json)
    await writable.close()

    await updateSettings({ lastBackupAt: Date.now() })
    return true
  } catch (e) {
    console.warn('[Backup] Failed:', e)
    return false
  }
}
