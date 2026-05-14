import { useState } from 'react'
import { updateSettings } from '../lib/storage'
import { INDIAN_BRANDS } from '../lib/brands'
import BrandChip from '../components/BrandChip'

const GOALS = [
  { key: 'awareness', label: 'Awareness', desc: 'Just track what you smoke. No targets.' },
  { key: 'reduce', label: 'Reduce', desc: 'Set a daily target and work toward it.' },
  { key: 'quit', label: 'Quit', desc: 'Track progress toward zero.' },
]

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

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(null)
  const [dailyTarget, setDailyTarget] = useState(5)
  const [currency, setCurrency] = useState('INR')
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [customBrandName, setCustomBrandName] = useState('')
  const [packPrice, setPackPrice] = useState('')
  const [perPack, setPerPack] = useState(20)
  const [singlePrice, setSinglePrice] = useState('')
  const [purchaseType, setPurchaseType] = useState('pack')
  const [quitReason, setQuitReason] = useState(null)
  const [saving, setSaving] = useState(false)

  const isINR = currency === 'INR'

  function handleBrandSelect(brand) {
    setSelectedBrand(brand)
    setPackPrice(brand.packPrice?.toString() ?? '')
    setPerPack(brand.perPack ?? 20)
    setSinglePrice(brand.singlePrice?.toString() ?? '')
  }

  function handleCustomBrand() {
    setSelectedBrand({ name: 'Other (custom)', packPrice: null, perPack: 20, singlePrice: null })
    setPackPrice('')
    setSinglePrice('')
  }

  async function handleFinish() {
    setSaving(true)
    const brandName = customBrandName.trim() || selectedBrand?.name || null
    const brandDef = brandName
      ? {
          name: brandName,
          packPrice: packPrice ? parseFloat(packPrice) : null,
          perPack: parseInt(perPack) || 20,
          singlePrice: singlePrice ? parseFloat(singlePrice) : null,
        }
      : null

    await updateSettings({
      goal,
      dailyTarget: goal === 'reduce' ? parseInt(dailyTarget) : null,
      currency,
      brands: brandDef ? [brandDef] : [],
      defaultBrand: brandDef?.name ?? null,
      defaultPurchaseType: purchaseType,
      customLocations: [],
      customMoods: [],
      backupReminderEnabled: true,
      lastBackupAt: null,
      onboardedAt: Date.now(),
      baselineDailyAvg: null,
      quitReason: quitReason ?? null,
    })
    onComplete()
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="flex flex-col items-start gap-8">
      <div>
        <h1 className="font-display text-3xl text-text leading-snug">
          A quiet tracker for the habit you're working on.
        </h1>
        <p className="text-muted text-sm mt-4 font-mono">
          Your data never leaves this device.
        </p>
      </div>
      <button
        onClick={() => setStep(1)}
        className="w-full py-4 bg-accent text-bg rounded-2xl font-sans font-medium text-base"
      >
        Begin
      </button>
    </div>,

    // Step 1: Goal
    <div key="goal" className="flex flex-col gap-6">
      <h2 className="font-display text-2xl text-text">What's your goal?</h2>
      <div className="flex flex-col gap-3">
        {GOALS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGoal(g.key)}
            className={`text-left px-5 py-4 rounded-2xl border transition-all duration-150 ${
              goal === g.key
                ? 'border-accent bg-accent-dim'
                : 'border-border bg-surface-2'
            }`}
          >
            <div className={`font-mono text-sm font-medium ${goal === g.key ? 'text-accent' : 'text-text'}`}>
              {g.label}
            </div>
            <div className="text-muted text-xs mt-1">{g.desc}</div>
          </button>
        ))}
      </div>
      <button
        disabled={!goal}
        onClick={() => setStep(goal === 'reduce' ? 2 : 3)}
        className="w-full py-4 bg-accent text-bg rounded-2xl font-sans font-medium text-base disabled:opacity-40"
      >
        Continue
      </button>
    </div>,

    // Step 2: Daily target (reduce only)
    <div key="target" className="flex flex-col gap-6">
      <h2 className="font-display text-2xl text-text">Daily target?</h2>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setDailyTarget((n) => Math.max(1, n - 1))}
          className="w-12 h-12 rounded-xl bg-surface-2 border border-border text-text text-xl flex items-center justify-center"
        >
          -
        </button>
        <span className="font-display text-5xl text-text flex-1 text-center">{dailyTarget}</span>
        <button
          type="button"
          onClick={() => setDailyTarget((n) => n + 1)}
          className="w-12 h-12 rounded-xl bg-surface-2 border border-border text-text text-xl flex items-center justify-center"
        >
          +
        </button>
      </div>
      <p className="text-muted text-xs font-mono">cigarettes per day</p>
      <button
        onClick={() => setStep(3)}
        className="w-full py-4 bg-accent text-bg rounded-2xl font-sans font-medium text-base"
      >
        Continue
      </button>
    </div>,

    // Step 3: Brand and cost
    <div key="brand" className="flex flex-col gap-5">
      <h2 className="font-display text-2xl text-text">What do you smoke?</h2>

      {/* Currency selector */}
      <div>
        <label className="text-muted text-xs font-mono block mb-2">Currency</label>
        <div className="flex gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`flex-1 py-2 rounded-xl border text-xs font-mono transition-all duration-150 ${
                currency === c
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border bg-surface-2 text-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Brand chips (INR only) */}
      {isINR && (
        <div>
          <label className="text-muted text-xs font-mono block mb-2">Select brand</label>
          <div className="flex flex-wrap gap-2">
            {INDIAN_BRANDS.map((b) => (
              <BrandChip
                key={b.name}
                brand={b}
                selected={selectedBrand?.name === b.name}
                onSelect={handleBrandSelect}
              />
            ))}
            <button
              type="button"
              onClick={handleCustomBrand}
              className={`px-4 py-2 rounded-xl text-sm font-mono border transition-all duration-150 ${
                selectedBrand?.name === 'Other (custom)'
                  ? 'bg-accent-dim border-accent text-accent'
                  : 'bg-surface-2 border-border text-muted'
              }`}
            >
              Other
            </button>
          </div>
        </div>
      )}

      {/* Custom brand name (non-INR or "Other") */}
      {(!isINR || selectedBrand?.name === 'Other (custom)') && (
        <div>
          <label className="text-muted text-xs font-mono block mb-2">Brand name</label>
          <input
            type="text"
            value={customBrandName}
            onChange={(e) => setCustomBrandName(e.target.value)}
            placeholder="e.g. Marlboro Red"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>
      )}

      {/* Pack price */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-muted text-xs font-mono block mb-2">Pack price</label>
          <input
            type="number"
            value={packPrice}
            onChange={(e) => setPackPrice(e.target.value)}
            placeholder="0"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>
        <div className="w-20">
          <label className="text-muted text-xs font-mono block mb-2">Per pack</label>
          <input
            type="number"
            value={perPack}
            onChange={(e) => setPerPack(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Purchase type */}
      <div>
        <label className="text-muted text-xs font-mono block mb-2">How do you usually buy?</label>
        <div className="flex rounded-xl border border-border overflow-hidden">
          {['pack', 'single'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPurchaseType(t)}
              className={`flex-1 py-3 text-sm font-mono capitalize transition-colors duration-150 ${
                purchaseType === t
                  ? 'bg-accent text-bg'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Single price (if single selected) */}
      {purchaseType === 'single' && (
        <div>
          <label className="text-muted text-xs font-mono block mb-2">Price per cigarette</label>
          <input
            type="number"
            value={singlePrice}
            onChange={(e) => setSinglePrice(e.target.value)}
            placeholder="0"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>
      )}

      <button
        onClick={() => setStep(4)}
        className="w-full py-4 bg-accent text-bg rounded-2xl font-sans font-medium text-base mt-2"
      >
        Continue
      </button>
    </div>,

    // Step 4: Why are you quitting?
    <div key="why" className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl text-text">Why do you want to quit?</h2>
        <p className="text-muted text-xs font-mono mt-2">Your reason will appear in your progress messages. Skip if you prefer.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {WHY_OPTIONS.map((w) => (
          <button
            key={w.key}
            type="button"
            onClick={() => setQuitReason(quitReason === w.key ? null : w.key)}
            className="text-left px-4 py-3 rounded-2xl border transition-all duration-150"
            style={{
              borderColor: quitReason === w.key ? 'var(--accent)' : 'var(--border)',
              background: quitReason === w.key ? 'var(--accent-dim)' : 'var(--surface-2)',
              color: quitReason === w.key ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            <span className="font-mono text-sm">{w.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep(5)}
        className="w-full py-4 bg-accent text-bg rounded-2xl font-sans font-medium text-base"
      >
        {quitReason ? 'Continue' : 'Skip'}
      </button>
    </div>,

    // Step 5: Done
    <div key="done" className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-3xl text-text">You're set.</h2>
        <p className="text-muted text-sm mt-3 font-mono leading-relaxed">
          A few things worth knowing:
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {[
            { dot: 'var(--accent)', text: 'Tap the button to log. Hold it to add trigger, mood, and location details.' },
            { dot: 'var(--accent)', text: 'Trigger details unlock your pattern insights — your most common trigger, peak risk window, and more.' },
            { dot: 'var(--accent)', text: 'Your momentum streak never resets to zero on a slip. One rough day doesn\'t erase your progress.' },
          ].map(({ dot, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: dot }} />
              <p className="text-muted text-xs font-mono leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={handleFinish}
        disabled={saving}
        className="w-full py-4 bg-accent text-bg rounded-2xl font-sans font-medium text-base disabled:opacity-60"
      >
        {saving ? 'Setting up...' : 'Start tracking'}
      </button>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between px-6 py-12 max-w-md mx-auto">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {[0, 1, 2, 3, 4, 5].filter((i) => !(i === 2 && goal !== 'reduce')).map((i) => {
          const actualStep = goal !== 'reduce' && i >= 2 ? i + 1 : i
          return (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                actualStep <= step ? 'w-6 bg-accent' : 'w-2 bg-border'
              }`}
            />
          )
        })}
      </div>

      <div className="flex-1">{steps[step]}</div>
    </div>
  )
}
