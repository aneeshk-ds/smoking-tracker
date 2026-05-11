// Money-equivalent translator.
// Prices verified May 2026 - treat as editable seed data.

const EQUIVALENTS_INR = [
  { item: 'movie ticket', cost: 400 },
  { item: 'Zomato meal for 2', cost: 600 },
  { item: 'month of Spotify Premium', cost: 119 },
  { item: 'Uber ride to the airport', cost: 800 },
  { item: 'pair of Adidas sneakers', cost: 4500 },
  { item: 'iPhone SE', cost: 49900 },
  { item: 'weekend trip to Goa (mid-range)', cost: 15000 },
  { item: 'PS5 game', cost: 4000 },
  { item: 'gym membership for a year', cost: 24000 },
  { item: 'AirPods Pro', cost: 24900 },
]

const EQUIVALENTS_USD = [
  { item: 'coffee', cost: 5 },
  { item: 'movie ticket', cost: 15 },
  { item: 'month of Netflix', cost: 16 },
  { item: 'Uber ride across town', cost: 20 },
  { item: 'dinner for 2', cost: 60 },
  { item: 'pair of Nike sneakers', cost: 90 },
  { item: 'AirPods', cost: 130 },
  { item: 'weekend trip (budget)', cost: 400 },
  { item: 'iPhone SE', cost: 430 },
  { item: 'PS5 game', cost: 70 },
]

const EQUIVALENTS_EUR = [
  { item: 'coffee', cost: 4 },
  { item: 'movie ticket', cost: 12 },
  { item: 'month of Spotify', cost: 10 },
  { item: 'dinner for 2', cost: 50 },
  { item: 'pair of Nike sneakers', cost: 80 },
  { item: 'AirPods', cost: 140 },
  { item: 'weekend city trip', cost: 300 },
  { item: 'iPhone SE', cost: 500 },
  { item: 'PS5 game', cost: 70 },
]

const EQUIVALENTS_GBP = [
  { item: 'coffee', cost: 4 },
  { item: 'movie ticket', cost: 12 },
  { item: 'month of Spotify', cost: 11 },
  { item: 'pub dinner for 2', cost: 45 },
  { item: 'pair of Nike sneakers', cost: 75 },
  { item: 'AirPods', cost: 130 },
  { item: 'weekend trip to Europe', cost: 250 },
  { item: 'iPhone SE', cost: 450 },
  { item: 'PS5 game', cost: 65 },
]

const TABLE = { INR: EQUIVALENTS_INR, USD: EQUIVALENTS_USD, EUR: EQUIVALENTS_EUR, GBP: EQUIVALENTS_GBP }

// Returns top 3 equivalents where floor(amount / cost) >= 1
export function getEquivalents(amount, currency = 'INR') {
  const list = TABLE[currency] ?? EQUIVALENTS_USD
  return list
    .map((e) => ({ ...e, count: Math.floor(amount / e.cost) }))
    .filter((e) => e.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
}

// Returns a single formatted string for display, e.g. "= 87 movie tickets"
export function equivalentLine(amount, currency = 'INR') {
  const results = getEquivalents(amount, currency)
  if (!results.length) return null
  const top = results[0]
  return `= ${top.count} ${top.item}${top.count !== 1 ? 's' : ''}`
}
