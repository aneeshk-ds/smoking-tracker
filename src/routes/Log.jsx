import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logCigarette, getSettings } from '../lib/storage'
import { useEffect } from 'react'

const MOODS = ['calm', 'stressed', 'bored', 'social', 'anxious', 'happy']
const TRIGGERS = ['stress', 'boredom', 'social', 'habit', 'craving', 'coffee', 'alcohol']
const LOCATIONS = ['home', 'work', 'outside', 'car', 'bar/restaurant', 'other']

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
          <label className="text-muted text-xs font-mono block mb-2">Bought as</label>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {['pack', 'single'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPurchaseType(t)}
                className={`flex-1 py-3 text-sm font-mono capitalize transition-colors ${
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
            <label className="text-muted text-xs font-mono block mb-2">Brand</label>
            <div className="flex flex-wrap gap-2">
              {settings.brands.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setBrand(b.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
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
          <label className="text-muted text-xs font-mono block mb-2">Location (optional)</label>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocation(location === l ? null : l)}
                className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                  location === l
                    ? 'border-accent bg-accent-dim text-accent'
                    : 'border-border bg-surface-2 text-muted'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div>
          <label className="text-muted text-xs font-mono block mb-2">Mood (optional)</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? null : m)}
                className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                  mood === m
                    ? 'border-accent bg-accent-dim text-accent'
                    : 'border-border bg-surface-2 text-muted'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger */}
        <div>
          <label className="text-muted text-xs font-mono block mb-2">Trigger (optional)</label>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrigger(trigger === t ? null : t)}
                className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                  trigger === t
                    ? 'border-accent bg-accent-dim text-accent'
                    : 'border-border bg-surface-2 text-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Craving */}
        <div>
          <label className="text-muted text-xs font-mono block mb-2">
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
          <div className="flex justify-between text-dim text-xs font-mono mt-1">
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
