// Indian and international number/currency formatting

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
}

export function formatCurrency(amount, currency = 'INR') {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency

  if (currency === 'INR') {
    return symbol + formatINR(amount)
  }

  // Standard locale formatting for non-INR
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return symbol + Math.round(amount).toLocaleString()
  }
}

function formatINR(amount) {
  const n = Math.round(amount)
  if (n >= 10_000_000) {
    return (n / 10_000_000).toFixed(1) + 'Cr'
  }
  if (n >= 100_000) {
    return (n / 100_000).toFixed(1) + 'L'
  }
  if (n >= 1_000) {
    // Indian comma convention: last 3 digits, then groups of 2
    const str = n.toString()
    const last3 = str.slice(-3)
    const rest = str.slice(0, -3)
    if (!rest) return last3
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
    return formatted + ',' + last3
  }
  return n.toString()
}

export function formatCount(n) {
  return n.toString()
}

export function currencySymbol(currency = 'INR') {
  return CURRENCY_SYMBOLS[currency] ?? currency
}
