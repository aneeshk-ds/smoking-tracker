// Demo-data generator. Populates realistic cigarette history so a new user can
// see how the metrics, charts and streaks look with data in them.
// Entries trend gently downward over time to illustrate "reduce" progress.

import { logCigarette, getSettings, updateSettings } from './storage'
import { INDIAN_BRANDS } from './brands'

const TRIGGERS = ['stress', 'coffee', 'boredom', 'social', 'after-meal', 'phone']
const LOCATIONS = ['home', 'work', 'balcony', 'car', 'outside']
const MOODS = ['calm', 'anxious', 'tired', 'happy', 'restless']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Deterministic-ish per-day count with a downward trend + weekend bump.
function countForDay(dayIndex, totalDays) {
  // dayIndex 0 = oldest, totalDays-1 = today
  const progress = dayIndex / Math.max(1, totalDays - 1) // 0..1
  const base = 10 - progress * 5 // starts ~10/day, ends ~5/day
  const jitter = Math.round((Math.random() - 0.5) * 4)
  return Math.max(0, Math.round(base) + jitter)
}

// Seed `days` days of history ending today. Returns number of entries created.
export async function seedDemoData(days = 30) {
  let settings = await getSettings()
  // Ensure a priced brand is configured, otherwise every demo entry costs 0
  // and all the money metrics read zero.
  if (!settings?.brands?.length || !settings?.defaultBrand) {
    const brands = settings?.brands?.length ? settings.brands : INDIAN_BRANDS
    const defaultBrand = settings?.defaultBrand ?? brands[0].name
    await updateSettings({
      brands,
      defaultBrand,
      defaultPurchaseType: settings?.defaultPurchaseType ?? 'pack',
    })
    settings = await getSettings()
  }
  const brand = settings?.defaultBrand ?? settings?.brands?.[0]?.name ?? null
  const purchaseType = settings?.defaultPurchaseType ?? 'pack'

  const now = new Date()
  let created = 0

  for (let d = 0; d < days; d++) {
    const dayIndex = days - 1 - d // 0 = oldest
    const dayDate = new Date(now)
    dayDate.setDate(now.getDate() - d)
    dayDate.setHours(0, 0, 0, 0)

    let n = countForDay(dayIndex, days)
    // Weekend bump
    const dow = dayDate.getDay()
    if (dow === 0 || dow === 6) n += 2

    // Never seed future hours for "today"
    const maxHour = d === 0 ? now.getHours() : 22

    for (let i = 0; i < n; i++) {
      const hour = 7 + Math.floor(Math.random() * Math.max(1, maxHour - 7))
      const minute = Math.floor(Math.random() * 60)
      const ts = new Date(dayDate)
      ts.setHours(hour, minute, 0, 0)
      if (ts.getTime() > now.getTime()) continue

      await logCigarette({
        timestamp: ts.getTime(),
        brand,
        purchaseType,
        trigger: pick(TRIGGERS),
        location: pick(LOCATIONS),
        mood: pick(MOODS),
        craving: 1 + Math.floor(Math.random() * 5),
      })
      created++
    }
  }
  return created
}
