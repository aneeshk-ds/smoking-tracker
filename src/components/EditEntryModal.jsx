import { useState } from 'react'
import { updateCigarette } from '../lib/storage'
import { format } from 'date-fns'
import { TRIGGERS, LOCATIONS, MOODS } from '../lib/constants'

function Chip({ value, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className="px-3 py-1.5 rounded-xl text-xs font-mono border transition-all"
      style={{
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        background: selected ? 'rgba(0,229,160,0.08)' : 'var(--surface-2)',
        color: selected ? 'var(--accent)' : 'var(--muted)',
      }}
    >
      {value}
    </button>
  )
}

export default function EditEntryModal({ entry, settings, onSave, onClose }) {
  const [location, setLocation] = useState(entry.location ?? null)
  const [mood, setMood] = useState(entry.mood ?? null)
  const [trigger, setTrigger] = useState(entry.trigger ?? null)
  const [craving, setCraving] = useState(entry.craving ?? null)
  const [brand, setBrand] = useState(entry.brand ?? '')
  const [saving, setSaving] = useState(false)

  const timeLabel = format(new Date(entry.timestamp), 'h:mm a')

  async function handleSave() {
    setSaving(true)
    try {
      await updateCigarette(entry.id, { location, mood, trigger, craving, brand })
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full rounded-t-3xl px-6 pt-5 pb-10 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--surface)' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>Edit entry</h2>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--muted)' }}>{timeLabel}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Brand */}
          {settings?.brands?.length > 0 && (
            <div>
              <label className="text-xs font-mono block mb-2" style={{ color: 'var(--muted)' }}>Brand</label>
              <div className="flex flex-wrap gap-2">
                {settings.brands.map((b) => (
                  <Chip key={b.name} value={b.name} selected={brand === b.name} onToggle={(v) => setBrand(brand === v ? '' : v)} />
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="text-xs font-mono block mb-2" style={{ color: 'var(--muted)' }}>Location</label>
            <select
              value={location ?? ''}
              onChange={(e) => setLocation(e.target.value || null)}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono border appearance-none"
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
            <label className="text-xs font-mono block mb-2" style={{ color: 'var(--muted)' }}>Mood</label>
            <select
              value={mood ?? ''}
              onChange={(e) => setMood(e.target.value || null)}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono border appearance-none"
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
            <label className="text-xs font-mono block mb-2" style={{ color: 'var(--muted)' }}>Trigger</label>
            <select
              value={trigger ?? ''}
              onChange={(e) => setTrigger(e.target.value || null)}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono border appearance-none"
              style={{
                background: 'var(--surface-2)',
                borderColor: trigger ? 'var(--accent)' : 'var(--border)',
                color: trigger ? 'var(--text)' : 'var(--muted)',
              }}
            >
              <option value="">— select trigger —</option>
              {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Craving */}
          <div>
            <label className="text-xs font-mono block mb-2" style={{ color: 'var(--muted)' }}>
              Craving: {craving !== null ? craving : 'not set'}
            </label>
            <input
              type="range" min="1" max="10"
              value={craving ?? 5}
              onChange={(e) => setCraving(parseInt(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs font-mono mt-1" style={{ color: 'var(--dim)' }}>
              <span>1 mild</span><span>10 intense</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-sans font-medium text-base mt-1 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
