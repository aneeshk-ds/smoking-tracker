import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isFSASupported, pickBackupFolder, disableBackup, performBackup } from '../lib/backup'
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
import { getThemePref, setThemePref } from '../lib/theme'
import { signOut } from '../lib/auth'
import { generateShareCard } from '../lib/share-card'
import { seedDemoData } from '../lib/demo-seed'
import InfoTip from '../components/InfoTip'
import { HELP } from '../lib/help'
import { requestTourReplay } from '../lib/tour'
import { reasonLabels, getReasons } from '../lib/reasons'
import {
  setBackupReminder,
  isBackupReminderEnabled,
  markExported,
} from '../components/BackupBanner'
import BottomNav from '../components/BottomNav'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']
const GOALS = ['awareness', 'reduce', 'quit']
const GOAL_LABELS = { awareness: 'Aware', reduce: 'Reduce', quit: 'Quit' }

const GOAL_DESCRIPTIONS = {
  awareness: 'Track without limits. Understand your patterns.',
  reduce:    'Cut down to a daily target. Build control.',
  quit:      'Zero is the goal. Every smoke-free hour counts.',
}

const WHY_OPTIONS = [
  { key: 'family',  label: 'My family' },
  { key: 'health',  label: 'My health' },
  { key: 'partner', label: 'My partner' },
  { key: 'child',   label: 'My child' },
  { key: 'money',   label: 'Save money' },
  { key: 'fitness', label: 'Improve fitness' },
  { key: 'control', label: 'Feel in control' },
  { key: 'doctor',  label: 'Doctor advised' },
]

export default function Settings() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [theme, setThemeState] = useState(getThemePref())
  function changeTheme(p) { setThemePref(p); setThemeState(p) }
  async function handleSignOut() { try { await signOut() } catch { /* ignore */ } }
  const [settings, setSettings] = useState(null)

  // Goal section
  const [pendingGoal, setPendingGoal] = useState(null)
  const [pendingTarget, setPendingTarget] = useState(null)
  const [goalSaved, setGoalSaved] = useState(false)
  const [showQuitReasonModal, setShowQuitReasonModal] = useState(false)
  const [pendingQuitReason, setPendingQuitReason] = useState(null)

  // Brand / purchase
  const [pendingBrand, setPendingBrand] = useState(null)
  const [pendingPurchaseType, setPendingPurchaseType] = useState(null)
  const [editingPrice, setEditingPrice] = useState(false)
  const [pricePackVal, setPricePackVal] = useState('')
  const [pricePerPackVal, setPricePerPackVal] = useState('')
  const [priceSingleVal, setPriceSingleVal] = useState('')
  const [addingBrand, setAddingBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandPack, setNewBrandPack] = useState('')
  const [newBrandPerPack, setNewBrandPerPack] = useState('')
  const [newBrandSingle, setNewBrandSingle] = useState('')

  // Currency
  const [pendingCurrency, setPendingCurrency] = useState(null)
  const [showCurrencyWarning, setShowCurrencyWarning] = useState(false)

  // Import
  const importInputRef = useRef(null)
  const [importStatus, setImportStatus] = useState(null) // null | 'ok' | 'err'
  const [importMsg, setImportMsg] = useState('')

  // Backup reminder toggle
  const [backupReminder, setBackupReminderState] = useState(() => isBackupReminderEnabled())

  // Auto folder backup
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState(null)
  const [backupStatus, setBackupStatus] = useState(null) // null | 'ok' | 'err'

  // Share / report generating state
  const [generating, setGenerating] = useState(false)
  const [seeding, setSeeding] = useState(false)

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
      if (s?.backupEnabled) setAutoBackupEnabled(true)
      if (s?.lastBackupAt) setLastBackupAt(s.lastBackupAt)
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
    // Switching TO quit — prompt for a reason first
    if (pendingGoal === 'quit' && settings.goal !== 'quit') {
      setPendingQuitReason(settings.quitReason ?? null)
      setShowQuitReasonModal(true)
      return
    }
    const patch = { goal: pendingGoal }
    if (pendingGoal === 'reduce') patch.dailyTarget = pendingTarget
    await updateSettings(patch)
    setSettings((prev) => ({ ...prev, ...patch }))
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 1500)
  }

  async function confirmGoalWithReason({ reasons, custom }) {
    const patch = { goal: 'quit', quitReasons: reasons || [], quitReasonCustom: (custom || '').trim() }
    await updateSettings(patch)
    setSettings((prev) => ({ ...prev, ...patch }))
    setShowQuitReasonModal(false)
    setPendingGoal('quit')
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 1500)
  }

  async function changeQuitReason({ reasons, custom }) {
    const patch = { quitReasons: reasons || [], quitReasonCustom: (custom || '').trim() }
    await updateSettings(patch)
    setSettings((prev) => ({ ...prev, ...patch }))
    setShowQuitReasonModal(false)
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

  async function addBrand() {
    const name = newBrandName.trim()
    if (!name) return
    if (brands.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      // Brand already exists — just select it.
      setPendingBrand(name)
      resetAddBrand()
      await updateSettings({ defaultBrand: name })
      setSettings((prev) => ({ ...prev, defaultBrand: name }))
      return
    }
    const brand = {
      name,
      packPrice: parseFloat(newBrandPack) || 0,
      perPack: parseInt(newBrandPerPack) || 20,
      singlePrice: parseFloat(newBrandSingle) || 0,
    }
    const updatedBrands = [...brands, brand]
    await updateSettings({ brands: updatedBrands, defaultBrand: name })
    setSettings((prev) => ({ ...prev, brands: updatedBrands, defaultBrand: name }))
    setPendingBrand(name)
    resetAddBrand()
  }

  function resetAddBrand() {
    setAddingBrand(false)
    setNewBrandName('')
    setNewBrandPack('')
    setNewBrandPerPack('')
    setNewBrandSingle('')
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

  async function handleLoadDemo() {
    setSeeding(true)
    try {
      await seedDemoData(30)
      window.location.reload()
    } finally {
      setSeeding(false)
    }
  }

  function toggleBackupReminder(val) {
    setBackupReminder(val)
    setBackupReminderState(val)
  }

  async function handleEnableAutoBackup() {
    try {
      await pickBackupFolder()
      setAutoBackupEnabled(true)
      setBackupStatus(null)
      // Run first backup immediately
      const ok = await performBackup(true)
      if (ok) {
        setLastBackupAt(Date.now())
        setBackupStatus('ok')
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setBackupStatus('err')
    }
  }

  async function handleDisableAutoBackup() {
    await disableBackup()
    setAutoBackupEnabled(false)
    setLastBackupAt(null)
    setBackupStatus(null)
  }

  async function handleManualBackupNow() {
    setBackupStatus(null)
    const ok = await performBackup(true)
    if (ok) {
      setLastBackupAt(Date.now())
      setBackupStatus('ok')
    } else {
      setBackupStatus('err')
    }
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

        {/* ── Account / Backup ── */}
        <Section title="ACCOUNT" help={HELP.setBackup}>
          {auth.user ? (
            <div>
              <button onClick={() => navigate('/account')} className="w-full flex items-center gap-3 py-2 text-left">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-medium" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {(auth.user.name || auth.user.email || auth.user.phone || 'U').trim().charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text truncate">{auth.user.name || auth.user.email || auth.user.phone}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{auth.user.email || auth.user.phone || 'Signed in'}</div>
                </div>
                <span style={{ color: 'var(--muted)' }}>›</span>
              </button>

              <button onClick={() => navigate('/account')} className="w-full flex items-center justify-between py-2.5 text-left border-t border-border">
                <span className="text-sm text-text">Backup &amp; sync</span>
                <span className="text-xs flex items-center gap-1.5" style={{ color: auth.status === 'synced' ? 'var(--success)' : 'var(--muted)' }}>
                  {auth.status === 'synced' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />}
                  {auth.status === 'synced' ? 'On \u00b7 synced' : auth.status === 'syncing' ? 'Syncing\u2026' : auth.status === 'error' ? 'Error \u2014 retrying' : 'On'}
                </span>
              </button>

              <button onClick={() => navigate('/account')} className="w-full flex items-center justify-between py-2.5 text-left border-t border-border">
                <span className="text-sm text-text">Login methods</span>
                <span className="text-xs capitalize flex items-center gap-1" style={{ color: 'var(--muted)' }}>{auth.user.method}<span>›</span></span>
              </button>

              <button onClick={handleSignOut} className="w-full text-left py-2.5 text-sm border-t border-border" style={{ color: 'var(--danger)' }}>
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/account')} className="w-full flex items-center justify-between py-2 text-left">
              <div>
                <div className="text-sm text-text">{auth.cloud ? 'Sign in to back up' : 'Backup not set up'}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{auth.cloud ? 'Guest \u2014 on this device only' : 'Local-only build'}</div>
              </div>
              <span style={{ color: 'var(--muted)' }}>›</span>
            </button>
          )}
          <button onClick={() => navigate('/privacy')} className="w-full text-left text-xs font-sans mt-2" style={{ color: 'var(--muted)' }}>
            Privacy
          </button>
        </Section>

        {/* ── Appearance ── */}
        <Section title="APPEARANCE" help={HELP.setAppearance}>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            {['system', 'light', 'dark'].map((opt) => (
              <button
                key={opt}
                onClick={() => changeTheme(opt)}
                className="flex-1 py-2 rounded-lg text-xs font-sans capitalize transition-colors"
                style={{ background: theme === opt ? 'var(--accent)' : 'transparent', color: theme === opt ? '#fff' : 'var(--muted)', fontWeight: 500 }}
              >
                {opt}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Goal ── */}
        <Section title="GOAL" help={HELP.setGoal}>
          <div className="flex gap-2 mb-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setPendingGoal(g)}
                className="flex-1 py-2 rounded-xl text-xs font-sans border transition-all duration-150"
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

          {/* Goal description */}
          <p className="text-[10px] font-sans mb-3" style={{ color: 'var(--dim)' }}>
            {GOAL_DESCRIPTIONS[pendingGoal]}
          </p>

          {pendingGoal === 'reduce' && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted text-xs font-sans">Daily target</span>
              <div className="flex items-center gap-3">
                <StepperButton onClick={() => setPendingTarget((t) => Math.max(1, t - 1))}>-</StepperButton>
                <span className="font-display text-xl text-text w-6 text-center">{pendingTarget}</span>
                <StepperButton onClick={() => setPendingTarget((t) => Math.min(40, t + 1))}>+</StepperButton>
              </div>
            </div>
          )}

          {/* Quit reason row — only when already in quit mode */}
          {settings.goal === 'quit' && pendingGoal === 'quit' && (
            <div
              className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <span className="text-[10px] font-sans" style={{ color: 'var(--dim)' }}>
                {reasonLabels(settings).length
                  ? `Reasons: ${reasonLabels(settings).join(', ')}`
                  : 'No reason set'}
              </span>
              <button
                onClick={() => { setPendingQuitReason(settings.quitReason ?? null); setShowQuitReasonModal(true) }}
                className="text-[10px] font-sans border border-border rounded px-2 py-1"
                style={{ color: 'var(--muted)' }}
              >
                Change
              </button>
            </div>
          )}

          {goalChanged && (
            <button
              onClick={saveGoal}
              className="w-full py-2 rounded-xl text-xs font-sans transition-all duration-150"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {goalSaved ? 'Saved' : 'Save goal'}
            </button>
          )}
          {goalSaved && !goalChanged && (
            <p className="text-center text-[10px] font-sans" style={{ color: 'var(--accent)' }}>Saved</p>
          )}
        </Section>

        {/* ── Brand defaults ── */}
        <Section title="DEFAULT BRAND" help={HELP.setBrand}>
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
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-sans border transition-all duration-150"
                style={{
                  background: pendingBrand === b.name ? 'rgba(0,229,160,0.12)' : 'var(--surface-2)',
                  color: pendingBrand === b.name ? 'var(--accent)' : 'var(--muted)',
                  borderColor: pendingBrand === b.name ? 'rgba(0,229,160,0.4)' : 'var(--border)',
                }}
              >
                {b.name}
              </button>
            ))}
            <button
              onClick={() => setAddingBrand((v) => !v)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-sans border border-dashed transition-all duration-150"
              style={{ background: 'transparent', color: 'var(--muted)', borderColor: 'var(--border)' }}
            >
              {addingBrand ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {/* Add-brand form */}
          {addingBrand && (
            <div className="space-y-2 mb-3">
              <input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Brand name"
                className="w-full px-3 py-2 rounded-lg text-xs font-sans bg-surface-2 border border-border text-body outline-none"
                style={{ background: 'var(--surface-2)', color: 'var(--body)', borderColor: 'var(--border)' }}
              />
              <div className="flex gap-2">
                <PriceField label="Pack price" value={newBrandPack} onChange={setNewBrandPack} />
                <PriceField label="Per pack" value={newBrandPerPack} onChange={setNewBrandPerPack} />
                <PriceField label="Single" value={newBrandSingle} onChange={setNewBrandSingle} />
              </div>
              <button
                onClick={addBrand}
                disabled={!newBrandName.trim()}
                className="w-full py-1.5 rounded-lg text-[10px] font-sans disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                Add & use this brand
              </button>
            </div>
          )}

          {/* Price summary */}
          {activeBrand && !editingPrice && (
            <div className="flex items-center justify-between">
              <div className="text-dim text-[10px] font-sans">
                Pack {formatCurrency(activeBrand.packPrice, settings.currency ?? 'INR')} / {activeBrand.perPack}
                {' · '}Single {formatCurrency(activeBrand.singlePrice, settings.currency ?? 'INR')}
              </div>
              <button
                onClick={openPriceEditor}
                className="text-muted text-[10px] font-sans border border-border rounded px-2 py-1"
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
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-sans"
                  style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingPrice(false)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-sans border border-border text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* ── Purchase type ── */}
        <Section title="PURCHASE TYPE" help={HELP.setPurchase}>
          <div className="flex gap-2">
            {['pack', 'single'].map((pt) => (
              <button
                key={pt}
                onClick={async () => {
                  setPendingPurchaseType(pt)
                  await updateSettings({ defaultPurchaseType: pt })
                  setSettings((prev) => ({ ...prev, defaultPurchaseType: pt }))
                }}
                className="flex-1 py-2 rounded-xl text-xs font-sans border transition-all duration-150 capitalize"
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
        <Section title="CURRENCY" help={HELP.setCurrency}>
          <div className="flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencySelect(c)}
                className="flex-1 py-2 rounded-xl text-xs font-sans border transition-all duration-150"
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
        <Section title="DATA" help={HELP.setDemo}>
          {/* Report + Share row */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={handlePrintReport}
              disabled={generating}
              className="flex-1 py-2 rounded-xl text-xs font-sans border border-border bg-surface-2 text-muted disabled:opacity-50"
            >
              {generating ? '...' : 'Monthly report'}
            </button>
            <button
              onClick={handleShareCard}
              disabled={generating}
              className="flex-1 py-2 rounded-xl text-xs font-sans border border-border bg-surface-2 text-muted disabled:opacity-50"
            >
              {generating ? '...' : 'Share card'}
            </button>
          </div>

          <button
            onClick={handleExportJSON}
            className="w-full py-2 rounded-xl text-xs font-sans border border-border bg-surface-2 text-muted mb-2"
          >
            Download my data
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="w-full py-2 rounded-xl text-xs font-sans border border-border bg-surface-2 text-muted mb-2"
          >
            Import data
          </button>
          {importStatus && (
            <p
              className="text-[10px] font-sans text-center mb-2"
              style={{ color: importStatus === 'ok' ? 'var(--success)' : 'var(--danger)' }}
            >
              {importMsg}
            </p>
          )}

          <button
            onClick={handleLoadDemo}
            disabled={seeding}
            className="w-full py-2 rounded-xl text-xs font-sans border border-dashed border-border bg-transparent text-dim mb-2 disabled:opacity-50"
          >
            {seeding ? 'Loading demo…' : 'Load 30 days of demo data'}
          </button>

          <button
            onClick={() => { requestTourReplay(); navigate('/') }}
            className="w-full py-2 rounded-xl text-xs font-sans border border-border bg-surface-2 text-muted mb-2"
          >
            Replay the app tour
          </button>

          {/* Backup is automatic via your account — no files to manage */}
          <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
            {auth.user ? (
              <div className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--success)' }} />
                <p className="text-xs font-sans leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Your data is backed up to your account and synced automatically across your devices. Nothing to export or manage.
                </p>
              </div>
            ) : (
              <button onClick={() => navigate('/account')} className="w-full text-left">
                <p className="text-xs font-sans leading-relaxed" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--accent)' }}>Sign in</span> to back up your data to the cloud and keep it synced across devices.
                </p>
              </button>
            )}
          </div>

          {/* Danger zone */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {clearStep === 0 && (
              <button
                onClick={handleClearStep}
                className="w-full py-2 rounded-xl text-xs font-sans border transition-all duration-150"
                style={{ borderColor: 'rgba(255,85,119,0.3)', color: 'var(--danger)', background: 'transparent' }}
              >
                Clear all data
              </button>
            )}
            {clearStep === 1 && (
              <div className="space-y-2">
                <p className="text-danger text-[10px] font-sans text-center">This will erase everything. Continue?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClearStep(0)}
                    className="flex-1 py-2 rounded-xl text-xs font-sans border border-border text-muted bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearStep}
                    className="flex-1 py-2 rounded-xl text-xs font-sans"
                    style={{ background: 'rgba(255,85,119,0.12)', color: 'var(--danger)', border: '1px solid rgba(255,85,119,0.3)' }}
                  >
                    Yes, continue
                  </button>
                </div>
              </div>
            )}
            {clearStep === 2 && (
              <div className="space-y-2">
                <p className="text-danger text-[10px] font-sans text-center">Final confirmation. All data will be deleted.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClearStep(0)}
                    className="flex-1 py-2 rounded-xl text-xs font-sans border border-border text-muted bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearStep}
                    className="flex-1 py-2 rounded-xl text-xs font-sans"
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
          <p className="text-dim text-[10px] font-sans">Smoking Tracker v0.1.0</p>
          <p className="text-dim text-[10px] font-sans">Privacy-first. All data stays on your device.</p>
        </div>

      </div>

      {/* Quit reason modal */}
      {showQuitReasonModal && (
        <GoalQuitModal
          currentReasons={getReasons(settings).keys}
          currentCustom={getReasons(settings).custom}
          isChangingReason={settings.goal === 'quit'}
          onConfirm={settings.goal === 'quit' ? changeQuitReason : confirmGoalWithReason}
          onCancel={() => setShowQuitReasonModal(false)}
        />
      )}

      {/* Currency warning modal */}
      {showCurrencyWarning && (
        <Modal>
          <p className="text-text text-sm font-sans font-medium mb-1">Change currency?</p>
          <p className="text-muted text-xs font-sans mb-4 leading-relaxed">
            Existing cost history will not be recalculated. Only new logs will use {pendingCurrency}.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCurrencyWarning(false); setPendingCurrency(null) }}
              className="flex-1 py-2 rounded-xl text-xs font-sans border border-border text-muted bg-surface-2"
            >
              Cancel
            </button>
            <button
              onClick={confirmCurrencyChange}
              className="flex-1 py-2 rounded-xl text-xs font-sans"
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

function Section({ title, children, help }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1 text-[10px] font-sans font-medium text-muted tracking-widest uppercase mb-3">{title}{help && <InfoTip text={help.text} label={help.label} size={12} />}</div>
      {children}
    </div>
  )
}

function StepperButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted font-sans text-base flex items-center justify-center"
    >
      {children}
    </button>
  )
}

function PriceField({ label, value, onChange }) {
  return (
    <div className="flex-1">
      <div className="text-dim text-[9px] font-sans mb-1">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs font-sans text-text outline-none focus:border-accent"
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

function GoalQuitModal({ currentReasons, currentCustom, isChangingReason, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(currentReasons || [])
  const [custom, setCustom] = useState(currentCustom || '')
  const toggle = (k) => setSelected((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k])
  const any = selected.length > 0 || custom.trim().length > 0

  return (
    <Modal>
      <p className="text-text text-sm font-sans font-medium mb-1">
        {isChangingReason ? 'Change your reasons' : 'Why are you quitting?'}
      </p>
      <p className="text-muted text-[10px] font-sans mb-4 leading-relaxed">
        Pick any that matter \u2014 choose more than one if you like. You can change these anytime.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {WHY_OPTIONS.map((opt) => {
          const on = selected.includes(opt.key)
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className="py-2 px-3 rounded-xl text-xs font-sans border transition-all duration-150"
              style={{
                background: on ? 'rgba(167,139,250,0.14)' : 'var(--surface-2)',
                color: on ? 'var(--accent)' : 'var(--muted)',
                borderColor: on ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {on ? '\u2713 ' : ''}{opt.label}
            </button>
          )
        })}
      </div>

      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        maxLength={60}
        placeholder="Or add your own reason"
        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-xs font-sans focus:border-accent focus:outline-none mb-4"
      />

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-xs font-sans border border-border text-muted bg-surface-2"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm({ reasons: selected, custom })}
          disabled={!isChangingReason && !any}
          className="flex-1 py-2 rounded-xl text-xs font-sans transition-all"
          style={{
            background: (isChangingReason || any) ? 'var(--accent)' : 'var(--surface-2)',
            color: (isChangingReason || any) ? 'var(--bg)' : 'var(--dim)',
            opacity: (isChangingReason || any) ? 1 : 0.6,
          }}
        >
          {isChangingReason ? 'Save reasons' : 'Set goal to Quit'}
        </button>
      </div>
    </Modal>
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
