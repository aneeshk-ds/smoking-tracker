// Pre-loaded Indian brands for INR users.
// Prices verified May 2026 - treat as editable seed data.

export const INDIAN_BRANDS = [
  { name: 'Gold Flake Kings', packPrice: 360, perPack: 20, singlePrice: 20 },
  { name: 'Gold Flake Lights', packPrice: 220, perPack: 10, singlePrice: 25 },
  { name: 'Classic Milds', packPrice: 360, perPack: 20, singlePrice: 20 },
  { name: 'Marlboro Advance', packPrice: 380, perPack: 20, singlePrice: 22 },
  { name: 'Wills Navy Cut', packPrice: 200, perPack: 10, singlePrice: 22 },
  { name: 'Four Square', packPrice: 180, perPack: 20, singlePrice: 12 },
  { name: 'Davidoff', packPrice: 480, perPack: 20, singlePrice: 28 },
]

// Returns the brand definition for a given name, or null
export function findBrand(brands, name) {
  return brands?.find((b) => b.name === name) ?? null
}

// Compute per-cigarette cost from brand settings and purchase type
export function costPerCigarette(brand, purchaseType = 'pack') {
  if (!brand) return 0
  if (purchaseType === 'single') return brand.singlePrice ?? 0
  if (!brand.packPrice || !brand.perPack) return 0
  return brand.packPrice / brand.perPack
}
