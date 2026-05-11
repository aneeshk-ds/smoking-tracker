import { useEffect, useRef, useState } from 'react'
import {
  getSettings,
  updateSettings,
  exportAllAsJSON,
  exportAllAsCSV,
  importFromJSON,
  deleteAllData,
  getCigarettesByRange,
  getTriggerBreakdown,
  getLocationBreakdown,
  getTrendSeries,
  getMoneySaved,
} from '../lib/storage'
import { INDIAN_BRANDS } from '../lib/brands'
import { formatCurrency } from '../lib/format'
import { openPrintReport } from '../lib/print-report'
import { generateShareCard } from '../lib/share-card'
import {
  setBackupReminder,
  isBackupReminderEnabled,
  markExported,
} from '../components/BackupBanner'
import BottomNav from '../components/BottomNav'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']
const GOALS = ['awareness', 'reduce', 'quit']
const GOAL_LABELS = { awareness: 'Aware', reduce: 'Reduce', quit: 'Quit' }

export default function Settings() {
  const [settings, setSettings] = useState(null)

  // Goal section
  const [pendingGoal, setPendingGoal] = useState(null)
  const [pendingTarget, setPendingTarget] = useState(null)
  const [goalSaved, setGoalSaved] = useState(false)

  // Brand / purchase
  const [pendingBrand, setPendingBrand] = useState(null)
  const [pendingPurchaseType, setPendingPurchaseType] = useState(null)
  const [editingPrice, setEditingPrice] = useState(false)
  const [pricePackVal, setPricePackVal] = useState('')
  const [pricePerPackVal, setPricePerPackVal] = useState('')
  const [priceSingleVal, setPriceSingleVal] = useState('')

  // Currency
  const [pendingCurrency, setPendingCurrency] = useState(null)
  const [showCurrencyWarning, setShowCurrencyWarning] = useState(false)

  // Import
  const importInputRef = useRef(null)
  const [importStatus, setImportStatus] = useState(null) // null | 'ok' | 'err'
  const [importMsg, setImportMsg] = useState('')

  // Backup reminder toggle
  const [backupReminder, setBackupReminderState] = useState(() => isBackupReminderEnabled())

  // Share / report generating state
  const [generating, setGenerating] = useState(false)

  // Clear data
  const [clearStep, setClearStep] = useState(0) // 0 = default, 1 = first confirm, 2 = second confirm

  useEffect(() => {
    getSettings().then((s) => {
      const defaults = {
        goal: 'awareness',
        dailyTarget: 5,
        defaultBrand: INDIAN_BRANDS[0].name,
        defaultPurchaseType: 'pack',
        currency: 'INR',
        brands: INDIAN_BRANDS,
      }
      const merged = s ? { ...defaults, ...s } : defaults
      setSettings(merged)
      setPendingGoal(merged.goal)
      setPendingTarget(merged.dailyTarget ?? 5)
      setPendingBrand(merged.defaultBrand)
      setPendingPurchaseType(merged.defaultPurchaseType)
    })
  }, [])

  if (!settings) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>
    )
  }

  const brands = settings.brands?.length ? settings.brands : INDIAN_BRANDS
  const activeBrand = brands.find((b) => b.name === pendingBrand) ?? brands[0]

  // ── Handlers ──

  async function saveGoal() {
    const patch = { goal: pendingGoal }
    if (pendingGoal === 'reduce') patch.dailyTarget = pendingTarget
    await updateSettings(patch)
    setSettings((prev) => ({ ...prev, ...patch }))
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 1500)
  }

  async function saveBrandDefaults() {
    const patch = { defaultBrand: pendingBrand, defaultPurchaseType: pendingPurchaseType }
    await updateSettings(patch)
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  async function saveBrandPrice() {
    const updatedBrands = brands.map((b) => {
      if (b.name !== pendingBrand) return b
      return {
        ...b,
        packPrice: parseFloat(pricePackVal) || b.packPrice,
        perPack: parseInt(pricePerPackVal) || b.perPack,
        singlePrice: parseFloat(priceSingleVal) || b.singlePrice,
      }
    })
    await updateSettings({ brands: updatedBrands })
    setSettings((prev) => ({ ...prev, brands: updatedBrands }))
    setEditingPrice(false)
  }

  function openPriceEditor() {
    setPricePackVal(String(activeBrand?.packPrice ?? ''))
    setPricePerPackVal(String(activeBrand?.perPack ?? ''))
    setPriceSingleVal(String(activeBrand?.singlePrice ?? ''))
    setEditingPrice(true)
  }

  function handleCurrencySelect(c) {
    if (c === (settings.currency ?? 'INR')) return
    setPendingCurrency(c)
    setShowCurrencyWarning(true)
  }

  async function confirmCurrencyChange() {
    await updateSettings({ currency: pendingCurrency })
    setSettings((prev) => ({ ...prev, currency: pendingCurrency }))
    setShowCurrencyWarning(false)
    setPendingCurrency(null)
  }

  function handleExportJSON() {
    exportAllAsJSON().then((json) => {
      downloadFile(json, 'tracker-backup.json', 'application/json')
      markExported()
    })
  }

  function handleExportCSV() {
    exportAllAsCSV().then((csv) => {
      if (!csv) { setImportMsg('Nothing to export.'); setImportStatus('err'); return }
      downloadFile(csv, 'tracker-log.csv', 'text/csv')
      markExported()
    })
  }

  async function handlePrintReport() {
    setGenerating(true)
    try {
      const endMs = Date.now()
      const startMs = endMs - 30 * 24 * 60 * 60 * 1000
      const [cigs, triggers, locations, trend, moneySaved] = await Promise.all([
        getCigarettesByRange(startMs, endMs),
        getTriggerBreakdown(30),
        getLocationBreakdown(30),
        getTrendSeries(30),
        getMoneySaved(30),
      ])
      const totalSmoked = cigs.length
      const totalSpent = cigs.reduce((s, c) => s + (c.cost || 0), 0)
      const avgPerDay = Math.round((totalSmoked / 30) * 10) / 10
      const dailyCost = totalSpent / 30

      const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      openPrintReport({
        month,
        stats: { totalSmoked, totalSpent, avgPerDay, moneySaved, dailyCost },
        settings,
        triggers,
        locations,
        trend,
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleShareCard() {
    setGenerating(true)
    try {
      const endMs = Date.now()
      const startMs = endMs - 30 * 24 * 60 * 60 * 1000
      const cigs = await getCigarettesByRange(startMs, endMs)
      const totalSmoked = cigs.length
      const totalSpent = cigs.reduce((s, c) => s + (c.cost || 0), 0)
      const avgPerDay = Math.round((totalSmoked / 30) * 10) / 10
      const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

      await generateShareCard({
        month,
        totalSmoked,
        avgPerDay,
        totalSpent,
        currency: settings.currency ?? 'INR',
        streak: null,
        goal: settings.goal ?? 'awareness',
      })
    } finally {
      setGenerating(false)
    }
  }

  function toggleBackupReminder(val) {
    setBackupReminder(val)
    setBackupReminderState(val)
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      await importFromJSON(text)
      setImportStatus('ok')
      setImportMsg('Import successful. Reload to see changes.')
    } catch {
      setImportStatus('err')
      setImportMsg('Invalid file. Could not import.')
    }
    e.target.value = ''
  }

  async function handleClearStep() {
    if (clearStep < 2) {
      setClearStep((s) => s + 1)
    } else {
      await deleteAllData()
      window.location.href = '/onboarding'
    }
  }

  const goalChanged = pendingGoal !== settings.goal || (pendingGoal === 'reduce' && pendingTarget !== settings.dailyTarget)

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-bg px-6 pt-8 pb-3">
        <h1 className="font-display text-2xl text-text">Settings</h1>
      </div>

      <div className="px-4 max-w-md mx-auto space-y-3 mt-1">

        {/* ── Goal ── */}
        <Section title="GOAL">
          <div className="flex gap-2 mb-3">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setPendingGoal(g)}
                className="flex-1 py-2 rounded-xl text-xs font-mono border transition-all duration-150"
                style={{
                  background: pendingGoal === g ? 'var(--accent)' : 'var(--surface-2)',
                  color: pendingGoal === g ? 'var(--bg)' : 'var(--muted)',
                  borderColor: pendingGoal === g ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>

          {pendingGoal === 'reduce' && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted text-xs font-mono">Daily target</span>
              <div className="flex items-center gap-3">
                <StepperButton onClick={() => setPendingTarget((t) => Math.max(1, t - 1))}>-</StepperButton>
                <span className="font-display text-xl text-text w-6 text-center">{pendingTarget}</span>
                <StepperButton onClick={() => setPendingTarget((t) => Math.min(40, t + 1))}>+</StepperButton>
              </div>
            </div>
          )}

          {goalChanged && (
            <button
              onClick={saveGoal}
              className="w-full py-2 rounded-xl text-xs font-mono transition-all duration-150"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {goalSaved ? 'Saved' : 'Save goal'}
            </button>
          )}
        </Section>

        {/* ── Brand defaults ── */}
        <Section title="DEFAULT BRAND">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {brands.map((b) => (
              <button
                key={b.name}
                onClick={async () => {
                  setPendingBrand(b.name)
                  setEditingPrice(false)
                  await updateSettings({ defaultBrand: b.name })
                  setSettings((prev) => ({ ...prev, defaultBrand: b.name }))
                }}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono border transition-all duration-150"
                style={{
                  background: pendingBrand === b.name ? 'rgba(0,229,160,0.12)' : 'var(--surface-2)',
                  color: pendingBrand === b.name ? 'var(--accent)' : 'var(--muted)',
                  borderColor: pendingBrand === b.name ? 'rgba(0,229,160,0.4)' : 'var(--border)',
                }}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Price summary */}
          {activeBrand && !editingPrice && (
            <div className="flex items-center justify-between">
              <div className="text-dim text-[10px] font-mono">
                Pack {formatCurrency(activeBrand.packPrice, settings.currency ?? 'INR')} / {activeBrand.perPack}
                {' · '}Single {formatCurrency(activeBrand.singlePrice, settings.currency ?? 'INR')}
              </div>
              <button
                onClick={openPriceEditor}
                className="text-muted text-[10px] font-mono border border-border rounded px-2 py-1"
              >
                Edit
              </button>
            </div>
          )}

          {/* Inline price editor */}
          {editingPrice && (
            <div className="space-y-2 mt-1">
              <div className="flex gap-2">
                <PriceField label="Pack price" value={pricePackVal} onChange={setPricePackVal} />
                <PriceField label="Per pack" value={pricePerPackVal} onChange={setPricePerPackVal} />
                <PriceField label="Single" value={priceSingleVal} onChange={setPriceSingleVal} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveBrandPrice}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-mono"
                  style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingPrice(false)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-mono border border-border text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* ── Purchase type ── */}
        <Section title="PURCHASE TYPE">
          <div className="flex gap-2">
            {['pack', 'single'].map((pt) => (
              <button
                key={pt}
                onClick={async () => {
                  setPendingPurchaseType(pt)
                  await updateSettings({ defaultPurchaseType: pt })
                  setSettings((prev) => ({ ...prev, defaultPurchaseType: pt }))
                }}
                className="flex-1 py-2 rounded-xl text-xs font-mono border transition-all duration-150 capitalize"
                style={{
                  background: pendingPurchaseType === pt ? 'rgba(0,229,160,0.12)' : 'var(--surface-2)',
                  color: pendingPurchaseType === pt ? 'var(--accent)' : 'var(--muted)',
                  borderColor: pendingPurchaseType === pt ? 'rgba(0,229,160,0.4)' : 'var(--border)',
                }}
              >
                {pt}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Currency ── */}
        <Section title="CURRENCY">
          <div className="flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencySelect(c)}
                className="flex-1 py-2 rounded-xl text-xs font-mono border transition-all duration-150"
                style={{
                  background: (settings.currency ?? 'INR') === c ? 'rgba(0,229,160,0.12)' : 'var(--surface-2)',
                  color: (settings.currency ?? 'INR') === c ? 'var(--accent)' : 'var(--muted)',
                  borderColor: (settings.currency ?? 'INR') === c ? 'rgba(0,229,160,0.4)' : 'var(--border)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Data ── */}
        <Section title="DATA">
          {/* Report + Share row */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={handlePrintReport}
              disabled={generating}
              className="flex-1 py-2 rounded-xl text-xs font-mono border border-border bg-surface-2 text-muted disabled:opacity-50"
            >
              {generating ? '...' : 'Monthly report'}
            </button>
            <button
              onClick={handleShareCard}
              disabled={generating}
              className="flex-1 py-2 rounded-xl text-xs font-mono border border-border bg-surface-2 text-muted disabled:opacity-50"
            >
              {generating ? '...' : 'Share card'}
            </button>
          </div>

          {/* Export row */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-2 rounded-xl text-xs font-mono border border-border bg-surface-2 text-muted"
            >
              Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 py-2 rounded-xl text-xs font-mono border border-border bg-surface-2 text-muted"
            >
              Export CSV
            </button>
          </div>

          <button
            onClick={() => importInputRef.current?.click()}
            className="w-full py-2 rounded-xl text-xs font-mono border border-border bg-surface-2 text-muted mb-2"
          >
            Import JSON backup
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          {importStatus && (
            <div
              className="text-[10px] font-mono px-3 py-2 rounded-lg mb-2"
              style={{
                background: importStatus === 'ok' ? 'rgba(0,229,160,0.08)' : 'rgba(255,85,119,0.08)',
                color: importStatus === 'ok' ? 'var(--accent)' : 'var(--danger)',
              }}
            >
              {importMsg}
            </div>
          )}

          {/* Backup reminder toggle */}
          <div
            className="flex items-center justify-between pt-3 mt-1"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-muted text-xs font-mono">Export reminder (30 days)</span>
            <Toggle value={backupReminder} onChange={toggleBackupReminder} />
          </div>

          {/* Danger zone */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {clearStep === 0 && (
              <button
                onClick={handleClearStep}
                className="w-full py-2 rounded-xl text-xs font-mono border transition-all duration-150"
                style={{ borderColor: 'rgba(255,85,119,0.3)', color: 'var(--danger)', background: 'transparent' }}
              >
                Clear all data
              </button>
            )}
            {clearStep === 1 && (
              <div className="space-y-2">
                <p className="text-danger text-[10px] font-mono text-center">This will erase everything. Continue?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClearStep(0)}
                    className="flex-1 py-2 rounded-xl text-xs font-mono border border-border text-muted bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearStep}
                    className="flex-1 py-2 rounded-xl text-xs font-mono"
                    style={{ background: 'rgba(255,85,119,0.12)', color: 'var(--danger)', border: '1px solid rgba(255,85,119,0.3)' }}
                  >
                    Yes, continue
                  </button>
                </div>
              </div>
            )}
            {clearStep === 2 && (
              <div className="space-y-2">
                <p className="text-danger text-[10px] font-mono text-center">Final confirmation. All data will be deleted.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClearStep(0)}
                    className="flex-1 py-2 rounded-xl text-xs font-mono border border-border text-muted bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearStep}
                    className="flex-1 py-2 rounded-xl text-xs font-mono"
                    style={{ background: 'var(--danger)', color: 'var(--bg)' }}
                  >
                    Delete everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── About ── */}
        <div className="text-center pb-2 space-y-1">
          <p className="text-dim text-[10px] font-mono">Smoking Tracker v0.1.0</p>
          <p className="text-dim text-[10px] font-mono">Privacy-first. All data stays on your device.</p>
        </div>

      </div>

      {/* Currency warning modal */}
      {showCurrencyWarning && (
        <Modal>
          <p className="text-text text-sm font-mono font-medium mb-1">Change currency?</p>
          <p className="text-muted text-xs font-mono mb-4 leading-relaxed">
            Existing cost history will not be recalculated. Only new logs will use {pendingCurrency}.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCurrencyWarning(false); setPendingCurrency(null) }}
              className="flex-1 py-2 rounded-xl text-xs font-mono border border-border text-muted bg-surface-2"
            >
              Cancel
            </button>
            <button
              onClick={confirmCurrencyChange}
              className="flex-1 py-2 rounded-xl text-xs font-mono"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              Change to {pendingCurrency}
            </button>
          </div>
        </Modal>
      )}

      <BottomNav />
    </div>
  )
}

// ── Sub-components ──

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-[10px] font-mono font-medium text-muted tracking-widest uppercase mb-3">{title}</div>
      {children}
    </div>
  )
}

function StepperButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted font-mono text-base flex items-center justify-center"
    >
      {children}
    </button>
  )
}

function PriceField({ label, value, onChange }) {
  return (
    <div className="flex-1">
      <div className="text-dim text-[9px] font-mono mb-1">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text outline-none focus:border-accent"
        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
      />
    </div>
  )
}

function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5">
        {children}
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
      style={{ backgroundColor: value ? 'var(--accent)' : 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-bg transition-transform duration-200"
        style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
