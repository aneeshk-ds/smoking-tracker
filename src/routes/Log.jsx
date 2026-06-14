import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logCigarette, getSettings } from '../lib/storage'
import { useEffect } from 'react'
import { TRIGGERS, LOCATIONS, MOODS } from '../lib/constants'

export default function Log() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(null)
  const [brand, setBrand] = useState('')
  const [purchaseType, setPurchaseType] = useState('pack')
  const [location, setLocation] = useState(null)
  const [mood, setMood] = useState(null)
  const [trigger, setTrigger] = useState(null)
  const [craving, setCraving] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s)
        setBrand(s.defaultBrand ?? '')
        setPurchaseType(s.defaultPurchaseType ?? 'pack')
        setLocation(s.lastUsedLocation ?? null)
        setMood(s.lastUsedMood ?? null)
      }
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const brandDef = settings?.brands?.find((b) => b.name === brand)
      await logCigarette({ brand, purchaseType, location, mood, trigger, craving })
      navigate('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg px-6 pt-10 pb-10 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-muted hover:text-text transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="font-display text-xl text-text">Log cigarette</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Purchase type */}
        <div>
          <label className="text-muted text-xs font-sans block mb-2">Bought as</label>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {['pack', 'single'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPurchaseType(t)}
                className={`flex-1 py-3 text-sm font-sans capitalize transition-colors ${
                  purchaseType === t ? 'bg-accent text-bg' : 'bg-surface-2 text-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Brand */}
        {settings?.brands?.length > 0 && (
          <div>
            <label className="text-muted text-xs font-sans block mb-2">Brand</label>
            <div className="flex flex-wrap gap-2">
              {settings.brands.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setBrand(b.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-sans border transition-all ${
                    brand === b.name
                      ? 'border-accent bg-accent-dim text-accent'
                      : 'border-border bg-surface-2 text-muted'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="text-muted text-xs font-sans block mb-2">Location (optional)</label>
          <select
            value={location ?? ''}
            onChange={(e) => setLocation(e.target.value || null)}
            className="w-full px-4 py-3 rounded-xl text-sm font-sans border appearance-none"
            style={{
              background: 'var(--surface-2)',
              borderColor: location ? 'var(--accent)' : 'var(--border)',
              color: location ? 'var(--text)' : 'var(--muted)',
            }}
          >
            <option value="">— select location —</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Mood */}
        <div>
          <label className="text-muted text-xs font-sans block mb-2">Mood (optional)</label>
          <select
            value={mood ?? ''}
            onChange={(e) => setMood(e.target.value || null)}
            className="w-full px-4 py-3 rounded-xl text-sm font-sans border appearance-none"
            style={{
              background: 'var(--surface-2)',
              borderColor: mood ? 'var(--accent)' : 'var(--border)',
              color: mood ? 'var(--text)' : 'var(--muted)',
            }}
          >
            <option value="">— select mood —</option>
            {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Trigger */}
        <div>
          <label className="text-muted text-xs font-sans block mb-2">Trigger (optional)</label>
          <select
            value={trigger ?? ''}
            onChange={(e) => setTrigger(e.target.value || null)}
            className="w-full px-4 py-3 rounded-xl text-sm font-sans border appearance-none"
            style={{
              background: 'var(--surface-2)',
              borderColor: trigger ? 'var(--accent)' : 'var(--border)',
              color: trigger ? 'var(--text)' : 'var(--muted)',
            }}
          >
            <option value="">— select trigger —</option>
            {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <p className="text-[10px] font-sans mt-1.5" style={{ color: 'var(--dim)' }}>
            filling this in helps surface your smoking patterns over time
          </p>
        </div>

        {/* Craving */}
        <div>
          <label className="text-muted text-xs font-sans block mb-2">
            Craving intensity (optional): {craving ?? 'not set'}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={craving ?? 5}
            onChange={(e) => setCraving(parseInt(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-dim text-xs font-sans mt-1">
            <span>1 mild</span>
            <span>10 intense</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-accent text-bg rounded-2xl font-sans font-medium text-base mt-2 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Log it'}
        </button>
      </div>
    </div>
  )
}
