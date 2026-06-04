import Dexie from 'dexie'
import { format, startOfDay, endOfDay, isWeekend, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { computeHonestStreak, computeSmokingStreak } from './streaks'

const db = new Dexie('TrackerDB')

db.version(1).stores({
  cigarettes: 'id, timestamp, brand, createdAt',
  settings: 'id',
  dayStats: 'date',
})

// v2 adds cloud-sync support: an updatedAt index and a tombstones table so
// deletions propagate to other devices.
db.version(2).stores({
  cigarettes: 'id, timestamp, brand, createdAt, updatedAt',
  settings: 'id',
  dayStats: 'date',
  tombstones: 'id, deletedAt',
})

// ---- Local change events (drive cloud sync) ----
const changeListeners = new Set()
export function onLocalChange(cb) {
  changeListeners.add(cb)
  return () => changeListeners.delete(cb)
}
function emitChange(kind) {
  for (const cb of changeListeners) {
    try { cb(kind) } catch { /* ignore */ }
  }
}

function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function dateStr(ms) {
  return format(new Date(ms), 'yyyy-MM-dd')
}

async function recomputeDayStats(dateString) {
  const start = startOfDay(new Date(dateString)).getTime()
  const end = endOfDay(new Date(dateString)).getTime()
  const rows = await db.cigarettes
    .where('timestamp')
    .between(start, end, true, true)
    .toArray()

  const settings = await getSettings()
  const target = settings?.dailyTarget ?? null
  const count = rows.length
  const spent = rows.reduce((acc, r) => acc + (r.cost || 0), 0)
  const underTarget = target !== null ? count <= target : true
  const weekend = isWeekend(new Date(dateString))

  await db.dayStats.put({
    date: dateString,
    count,
    spent,
    underTarget,
    isWeekend: weekend,
  })
}

// ---- Cigarettes ----

export async function logCigarette(partial = {}) {
  const settings = await getSettings()
  const now = Date.now()
  const brand =
    partial.brand ?? settings?.defaultBrand ?? null
  const purchaseType =
    partial.purchaseType ?? settings?.defaultPurchaseType ?? 'pack'

  let cost = partial.cost ?? null
  if (cost === null && brand && settings?.brands) {
    const brandDef = settings.brands.find((b) => b.name === brand)
    if (brandDef) {
      if (purchaseType === 'single' && brandDef.singlePrice) {
        cost = brandDef.singlePrice
      } else if (purchaseType === 'pack' && brandDef.packPrice && brandDef.perPack) {
        cost = brandDef.packPrice / brandDef.perPack
      }
    }
  }

  const record = {
    id: uuid(),
    timestamp: partial.timestamp ?? now,
    brand,
    cost: cost ?? 0,
    purchaseType,
    location: partial.location ?? null,
    mood: partial.mood ?? null,
    trigger: partial.trigger ?? null,
    craving: partial.craving ?? null,
    resisted: false,
    createdAt: now,
    updatedAt: now,
  }

  await db.cigarettes.add(record)
  await recomputeDayStats(dateStr(record.timestamp))

  // Update last-used defaults in settings
  const patch = { defaultBrand: brand, defaultPurchaseType: purchaseType }
  if (partial.location) patch.lastUsedLocation = partial.location
  if (partial.mood) patch.lastUsedMood = partial.mood
  await updateSettings(patch)

  // Auto-set baseline after 7 days of logging
  await maybeSetBaseline()

  emitChange('cigarette')
  return record
}

async function maybeSetBaseline() {
  const settings = await getSettings()
  if (settings?.baselineDailyAvg !== null && settings?.baselineDailyAvg !== undefined) return

  const allStats = await db.dayStats.toArray()
  if (allStats.length >= 7) {
    const sorted = allStats.sort((a, b) => a.date.localeCompare(b.date))
    const first7 = sorted.slice(0, 7)
    const avg = first7.reduce((s, d) => s + d.count, 0) / 7
    await setBaselineDailyAvg(Math.round(avg * 10) / 10)
  }
}

export async function getCigarettesByDay(dateString) {
  const start = startOfDay(new Date(dateString)).getTime()
  const end = endOfDay(new Date(dateString)).getTime()
  return db.cigarettes
    .where('timestamp')
    .between(start, end, true, true)
    .toArray()
}

export async function getCigarettesByRange(startMs, endMs) {
  return db.cigarettes
    .where('timestamp')
    .between(startMs, endMs, true, true)
    .toArray()
}

export async function deleteCigarette(id) {
  const rec = await db.cigarettes.get(id)
  if (!rec) return
  await db.cigarettes.delete(id)
  await db.tombstones.put({ id, deletedAt: Date.now() })
  await recomputeDayStats(dateStr(rec.timestamp))
  emitChange('cigarette')
}

export async function updateCigarette(id, patch) {
  await db.cigarettes.update(id, { ...patch, updatedAt: Date.now() })
  const rec = await db.cigarettes.get(id)
  if (rec) await recomputeDayStats(dateStr(rec.timestamp))
  emitChange('cigarette')
}

// ---- Settings ----

export async function getSettings() {
  return db.settings.get('user')
}

export async function updateSettings(patch) {
  const stamped = { ...patch, updatedAt: Date.now() }
  const existing = await db.settings.get('user')
  if (existing) {
    await db.settings.update('user', stamped)
  } else {
    await db.settings.put({ id: 'user', ...stamped })
  }
  emitChange('settings')
}

export async function addBrand(brand) {
  const settings = await getSettings()
  const brands = settings?.brands ?? []
  const exists = brands.find((b) => b.name === brand.name)
  if (exists) return
  await updateSettings({ brands: [...brands, brand] })
}

export async function removeBrand(name) {
  const settings = await getSettings()
  const brands = (settings?.brands ?? []).filter((b) => b.name !== name)
  await updateSettings({ brands })
}

export async function setBaselineDailyAvg(value) {
  await updateSettings({ baselineDailyAvg: value })
}

// ---- Aggregates ----

export async function getTodayCount() {
  const today = dateStr(Date.now())
  const stat = await db.dayStats.get(today)
  return stat?.count ?? 0
}

export async function getTodaySpend() {
  const today = dateStr(Date.now())
  const stat = await db.dayStats.get(today)
  return stat?.spent ?? 0
}

export async function getCurrentStreakHonest() {
  const settings = await getSettings()
  const allStats = await db.dayStats.toArray()
  return computeHonestStreak(allStats, settings)
}

export async function getSmokingStreak() {
  const allStats = await db.dayStats.toArray()
  return computeSmokingStreak(allStats)
}

export async function getHeatmapData(days = 90) {
  const endMs = Date.now()
  const startMs = endMs - days * 24 * 60 * 60 * 1000
  const rows = await getCigarettesByRange(startMs, endMs)

  // 7 rows (days of week 0-6) x 24 cols (hours)
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const r of rows) {
    const d = new Date(r.timestamp)
    grid[d.getDay()][d.getHours()]++
  }
  return grid
}

export async function getWeekdayWeekendBreakdown(days = 30) {
  const stats = await getStatsByRange(days)
  const weekdayStats = stats.filter((s) => !s.isWeekend)
  const weekendStats = stats.filter((s) => s.isWeekend)

  const avg = (arr) =>
    arr.length ? arr.reduce((s, d) => s + d.count, 0) / arr.length : 0
  const total = (arr) => arr.reduce((s, d) => s + d.count, 0)

  return {
    weekday: { avg: Math.round(avg(weekdayStats) * 10) / 10, total: total(weekdayStats) },
    weekend: { avg: Math.round(avg(weekendStats) * 10) / 10, total: total(weekendStats) },
  }
}

export async function getTriggerBreakdown(days = 30) {
  const endMs = Date.now()
  const startMs = endMs - days * 24 * 60 * 60 * 1000
  const rows = await getCigarettesByRange(startMs, endMs)
  const counts = {}
  for (const r of rows) {
    if (r.trigger) counts[r.trigger] = (counts[r.trigger] || 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export async function getLocationBreakdown(days = 30) {
  const endMs = Date.now()
  const startMs = endMs - days * 24 * 60 * 60 * 1000
  const rows = await getCigarettesByRange(startMs, endMs)
  const counts = {}
  for (const r of rows) {
    if (r.location) counts[r.location] = (counts[r.location] || 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export async function getTrendSeries(days = 30) {
  const stats = await getStatsByRange(days)
  return stats.map((s) => ({ date: s.date, count: s.count, spent: s.spent }))
}

export async function getProjectedCost(years = 10) {
  const settings = await getSettings()
  const allStats = await db.dayStats.toArray()
  if (!allStats.length) return 0
  const avg = allStats.reduce((s, d) => s + d.spent, 0) / allStats.length
  return avg * 365 * years
}

export async function getMoneySaved(days = 30) {
  const settings = await getSettings()
  if (!settings?.baselineDailyAvg) return 0

  const stats = await getStatsByRange(days)
  if (!stats.length) return 0

  const brandDef = settings.brands?.find((b) => b.name === settings.defaultBrand)
  const costPerCig =
    brandDef
      ? (settings.defaultPurchaseType === 'single'
          ? brandDef.singlePrice ?? 0
          : (brandDef.packPrice ?? 0) / (brandDef.perPack ?? 20))
      : 0

  const baselineSpendPerDay = settings.baselineDailyAvg * costPerCig
  const actualSpend = stats.reduce((s, d) => s + d.spent, 0)
  const projectedSpend = baselineSpendPerDay * stats.length
  return Math.max(0, projectedSpend - actualSpend)
}

export async function getMoneyEquivalents(amount) {
  const settings = await getSettings()
  const currency = settings?.currency ?? 'INR'
  const { getEquivalents } = await import('./equivalents')
  return getEquivalents(amount, currency)
}

// ---- Export / Import ----

export async function exportAllAsJSON() {
  const cigarettes = await db.cigarettes.toArray()
  const settings = await db.settings.toArray()
  const dayStats = await db.dayStats.toArray()
  return JSON.stringify({ cigarettes, settings, dayStats, exportedAt: Date.now() }, null, 2)
}

export async function exportAllAsCSV() {
  const cigarettes = await db.cigarettes.toArray()
  if (!cigarettes.length) return ''
  const keys = Object.keys(cigarettes[0])
  const header = keys.join(',')
  const rows = cigarettes.map((r) =>
    keys.map((k) => JSON.stringify(r[k] ?? '')).join(',')
  )
  return [header, ...rows].join('\n')
}

export async function importFromJSON(data) {
  let parsed
  try {
    parsed = typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    throw new Error('Invalid JSON')
  }
  if (parsed.cigarettes) await db.cigarettes.bulkPut(parsed.cigarettes)
  if (parsed.settings) await db.settings.bulkPut(parsed.settings)
  if (parsed.dayStats) await db.dayStats.bulkPut(parsed.dayStats)
}

export async function getLastCigaretteTime() {
  const last = await db.cigarettes.orderBy('timestamp').last()
  return last?.timestamp ?? null
}

export async function deleteAllData() {
  await db.cigarettes.clear()
  await db.dayStats.clear()
  await db.settings.clear()
  if (db.tombstones) await db.tombstones.clear()
  emitChange('reset')
}

// ---- Week / Month snapshots ----

export async function getWeekCount(offsetWeeks = 0) {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7

  if (offsetWeeks === 0) {
    const startMs = startOfDay(subDays(today, daysSinceMonday)).getTime()
    const rows = await getCigarettesByRange(startMs, Date.now())
    return rows.length
  } else {
    const lastSunday = subDays(today, daysSinceMonday + 1)
    const lastMonday = subDays(lastSunday, 6)
    const startMs = startOfDay(lastMonday).getTime()
    const endMs = endOfDay(lastSunday).getTime()
    const rows = await getCigarettesByRange(startMs, endMs)
    return rows.length
  }
}

export async function getMonthCount(offsetMonths = 0) {
  const today = new Date()
  if (offsetMonths === 0) {
    const startMs = startOfMonth(today).getTime()
    const rows = await getCigarettesByRange(startMs, Date.now())
    return rows.length
  } else {
    const target = subMonths(today, offsetMonths)
    const startMs = startOfMonth(target).getTime()
    const endMs = endOfMonth(target).getTime()
    const rows = await getCigarettesByRange(startMs, endMs)
    return rows.length
  }
}

export async function getWeekSnapshot() {
  const [thisWeek, lastWeek] = await Promise.all([getWeekCount(0), getWeekCount(1)])
  return { thisWeek, lastWeek }
}

export async function getMonthSnapshot() {
  const [thisMonth, lastMonth] = await Promise.all([getMonthCount(0), getMonthCount(1)])
  return { thisMonth, lastMonth }
}

// ---- Smoke-free rate ----

export async function getSmokeFreeRate(days = 30) {
  const settings = await getSettings()
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null
  if (goal === 'awareness') return null

  const stats = await getStatsByRange(days)
  if (stats.length < 3) return null

  let smokeFree = 0
  for (const s of stats) {
    if (goal === 'quit' && s.count === 0) smokeFree++
    else if (goal === 'reduce' && dailyTarget !== null && s.count <= dailyTarget) smokeFree++
  }

  return {
    smokeFree,
    total: stats.length,
    rate: Math.round((smokeFree / stats.length) * 100),
  }
}

// ---- Craving intensity trend ----

export async function getCravingTrend(days = 30) {
  const endMs = Date.now()
  const startMs = endMs - days * 24 * 60 * 60 * 1000
  const rows = await getCigarettesByRange(startMs, endMs)

  const byDate = {}
  for (const r of rows) {
    if (r.craving == null) continue
    const d = dateStr(r.timestamp)
    if (!byDate[d]) byDate[d] = { sum: 0, count: 0 }
    byDate[d].sum += r.craving
    byDate[d].count++
  }

  const series = Object.entries(byDate)
    .map(([date, { sum, count }]) => ({ date, avg: Math.round((sum / count) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return series.length >= 3 ? series : null
}

// ---- All entries (for pattern analysis) ----

export async function getAllCigarettes() {
  return db.cigarettes.orderBy('timestamp').toArray()
}

// ---- Today's entries ----

export async function getTodayEntries() {
  const today = dateStr(Date.now())
  const start = startOfDay(new Date(today)).getTime()
  const end = endOfDay(new Date(today)).getTime()
  return db.cigarettes
    .where('timestamp')
    .between(start, end, true, true)
    .reverse()
    .toArray()
}

export async function getAllDayStats() {
  return db.dayStats.orderBy('date').toArray()
}

// ---- Helpers ----

async function getStatsByRange(days) {
  const today = dateStr(Date.now())
  const allStats = await db.dayStats.toArray()
  return allStats
    .filter((s) => {
      const diffDays =
        (new Date(today) - new Date(s.date)) / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays < days
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}


// ---- Cloud sync helpers ----

// Settings keys that must never leave the device (browser handles, transient).
const LOCAL_ONLY_SETTINGS_KEYS = ['backupDirHandle', 'backupEnabled', 'lastBackupAt']

export function stripLocalOnly(settings) {
  if (!settings) return settings
  const out = {}
  for (const [k, v] of Object.entries(settings)) {
    if (LOCAL_ONLY_SETTINGS_KEYS.includes(k)) continue
    out[k] = v
  }
  return out
}

// Snapshot of everything that should sync to the cloud.
export async function getSyncSnapshot() {
  const cigarettes = await db.cigarettes.toArray()
  const settings = await db.settings.get('user')
  const tombstones = db.tombstones ? await db.tombstones.toArray() : []
  return {
    cigarettes,
    settings: settings ? stripLocalOnly(settings) : null,
    tombstones,
  }
}

// Write remote rows into the local DB without re-emitting a change event.
export async function applyRemoteCigarettes(rows) {
  if (!rows?.length) return
  await db.cigarettes.bulkPut(rows)
  const dates = new Set(rows.map((r) => dateStr(r.timestamp)))
  for (const d of dates) await recomputeDayStats(d)
}

export async function applyRemoteDeletes(ids) {
  if (!ids?.length) return
  const affected = new Set()
  for (const id of ids) {
    const rec = await db.cigarettes.get(id)
    if (rec) affected.add(dateStr(rec.timestamp))
    await db.cigarettes.delete(id)
  }
  for (const d of affected) await recomputeDayStats(d)
}

export async function applyRemoteSettings(patch) {
  if (!patch) return
  const clean = stripLocalOnly(patch)
  const existing = await db.settings.get('user')
  if (existing) await db.settings.update('user', clean)
  else await db.settings.put({ id: 'user', ...clean })
  // no emitChange: this came from the cloud, don't echo it back
}

export async function getTombstones() {
  return db.tombstones ? db.tombstones.toArray() : []
}

export async function clearTombstones(ids) {
  if (!ids?.length || !db.tombstones) return
  await db.tombstones.bulkDelete(ids)
}
