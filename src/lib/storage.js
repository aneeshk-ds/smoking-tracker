import Dexie from 'dexie'
import { format, startOfDay, endOfDay, isWeekend, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { computeHonestStreak } from './streaks'

const db = new Dexie('TrackerDB')

db.version(1).stores({
  cigarettes: 'id, timestamp, brand, createdAt',
  settings: 'id',
  dayStats: 'date',
})

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
  await recomputeDayStats(dateStr(rec.timestamp))
}

export async function updateCigarette(id, patch) {
  await db.cigarettes.update(id, patch)
  const rec = await db.cigarettes.get(id)
  if (rec) await recomputeDayStats(dateStr(rec.timestamp))
}

// ---- Settings ----

export async function getSettings() {
  return db.settings.get('user')
}

export async function updateSettings(patch) {
  const existing = await db.settings.get('user')
  if (existing) {
    await db.settings.update('user', patch)
  } else {
    await db.settings.put({ id: 'user', ...patch })
  }
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
