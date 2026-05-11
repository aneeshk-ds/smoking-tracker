import { useState, useEffect } from 'react'
import { getProjectedCost, getSettings } from '../lib/storage'
import { getEquivalents } from '../lib/equivalents'

// Rotates through money-equivalent comparisons for the 10-year projection
export default function EquivalentLine() {
  const [text, setText] = useState(null)
  const [index, setIndex] = useState(0)
  const [items, setItems] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      const [projected, settings] = await Promise.all([
        getProjectedCost(10),
        getSettings(),
      ])
      if (!mounted) return
      const currency = settings?.currency ?? 'INR'
      const equivalents = getEquivalents(projected, currency)
      if (equivalents.length) {
        setItems(equivalents)
        setText(formatLine(equivalents[0]))
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Rotate every 8 seconds on home screen visits
  useEffect(() => {
    if (!items.length) return
    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % items.length
        setText(formatLine(items[next]))
        return next
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [items])

  if (!text) return null

  return (
    <p className="text-dim text-xs font-mono mt-1 transition-opacity duration-500">
      {text}
    </p>
  )
}

function formatLine(eq) {
  return `= ${eq.count} ${eq.item}${eq.count !== 1 ? 's' : ''} over 10 years`
}
