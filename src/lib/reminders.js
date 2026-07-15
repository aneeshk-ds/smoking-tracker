// In-app nudges + reminders. Phase 1 is in-app + best-effort local notifications
// while the app is running/installed; real closed-app delivery (Web Push) is a
// fast-follow that will reuse this same config.
import { getSettings, getTodayCount } from './storage'

// Four meal-anchored defaults, fully customisable by the user.
export const DEFAULT_REMINDERS = [
  { id: 'r_breakfast', label: 'Breakfast', time: '08:00', on: true },
  { id: 'r_lunch',     label: 'Lunch',     time: '13:00', on: true },
  { id: 'r_snack',     label: 'Snack',     time: '17:00', on: true },
  { id: 'r_dinner',    label: 'Dinner',    time: '20:30', on: true },
]

export function getReminderConfig(settings) {
  const r = settings?.reminders
  const times = Array.isArray(r?.times) && r.times.length ? r.times : DEFAULT_REMINDERS
  return { enabled: !!r?.enabled, times }
}

export function preSmokePauseOn(settings) {
  return !!settings?.preSmokePause
}

// Pure: choose the in-app nudge to show given today's state. {tone,text} | null.
export function pickNudge({ count = 0, goal = 'awareness', dailyTarget = null, hour = new Date().getHours() }) {
  const logged = count > 0
  const onTarget = goal === 'quit'
    ? count === 0
    : (dailyTarget != null ? count <= dailyTarget : null)

  // Evening close-out / feel-good
  if (hour >= 20) {
    if (goal === 'quit' && !logged) return { tone: 'good', text: "Smoke-free today — that's a real win. Rest easy. 🎉" }
    if (goal === 'reduce' && onTarget) return { tone: 'good', text: `Under your limit today (${count}/${dailyTarget}). Nicely done. ✅` }
    if (onTarget === false) return { tone: 'warn', text: 'Rough day — tomorrow resets. Set your intention before bed.' }
    return null
  }
  // Over target during the day
  if (onTarget === false) return { tone: 'warn', text: `Over target today (${count}/${dailyTarget}). A 10-min delay can stop the next one.` }
  // Nothing logged yet, later in the day
  if (!logged && hour >= 11) {
    if (goal === 'quit') return { tone: 'good', text: 'Still smoke-free today — keep it going. 🔥' }
    if (goal === 'reduce') return { tone: 'info', text: `Fresh day — nothing logged yet. Staying under ${dailyTarget}?` }
    return { tone: 'info', text: 'Nothing logged yet today — a quick tap keeps your record honest.' }
  }
  return null
}

// ---- best-effort local notifications (only while the app is running) ----
export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}
export async function requestNotifyPermission() {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try { return await Notification.requestPermission() } catch { return 'denied' }
}
export function fireNotification(title, body) {
  try {
    if (notificationsSupported() && Notification.permission === 'granted') {
      const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
      new Notification(title, { body, icon: base + 'icons/icon-192.png', tag: 'st-reminder', renotify: false })
    }
  } catch { /* ignore */ }
}

// Which reminder id is due at `now` (HH:MM match, toggled on). Pure.
export function dueReminderId(times, now = new Date()) {
  const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const match = (times || []).find((t) => t.on !== false && t.time === cur)
  return match ? match.id : null
}

function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
export function alreadyFired(id) { try { return localStorage.getItem(`st_rem_${id}_${todayKey()}`) === '1' } catch { return false } }
export function markFired(id) { try { localStorage.setItem(`st_rem_${id}_${todayKey()}`, '1') } catch { /* ignore */ } }

// App-wide scheduler tick (call ~every minute). Fires one notification per due slot per day.
export async function reminderTick() {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const settings = await getSettings()
  const cfg = getReminderConfig(settings)
  if (!cfg.enabled) return
  const id = dueReminderId(cfg.times)
  if (!id || alreadyFired(id)) return
  markFired(id)
  const count = await getTodayCount()
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = goal === 'reduce' ? (settings?.dailyTarget ?? null) : null
  const nudge = pickNudge({ count, goal, dailyTarget }) || { text: 'Quick check-in — how are you doing today?' }
  fireNotification('Smoking Tracker', nudge.text)
}
