// Quit-reason model: users can pick MULTIPLE preset reasons and/or add a custom
// one, and change them any time. Backward-compatible with the old single
// `quitReason` field.
export const REASON_OPTIONS = [
  { key: 'family',  label: 'My family' },
  { key: 'health',  label: 'My health' },
  { key: 'partner', label: 'My partner' },
  { key: 'child',   label: 'My child' },
  { key: 'money',   label: 'Save money' },
  { key: 'fitness', label: 'Improve fitness' },
  { key: 'control', label: 'Feel in control' },
  { key: 'doctor',  label: 'Doctor advised' },
]

const PHRASE = {
  family: 'for your family', health: 'for your health', partner: 'for your partner',
  child: 'for your child', money: 'to save money', fitness: 'for your fitness',
  control: 'to feel in control', doctor: "on doctor's advice",
}
const LABEL = Object.fromEntries(REASON_OPTIONS.map((o) => [o.key, o.label]))

// Normalises settings -> { keys: string[], custom: string }
export function getReasons(settings) {
  if (!settings) return { keys: [], custom: '' }
  let keys = Array.isArray(settings.quitReasons) ? settings.quitReasons.filter(Boolean) : []
  if (!keys.length && settings.quitReason) keys = [settings.quitReason] // legacy single
  return { keys, custom: (settings.quitReasonCustom || '').trim() }
}

export function reasonLabels(settings) {
  const { keys, custom } = getReasons(settings)
  const labels = keys.map((k) => LABEL[k]).filter(Boolean)
  if (custom) labels.push(custom)
  return labels
}

export function reasonPhrases(settings) {
  const { keys, custom } = getReasons(settings)
  const phrases = keys.map((k) => PHRASE[k]).filter(Boolean)
  if (custom) phrases.push(custom)
  return phrases
}

export function hasReasons(settings) {
  const { keys, custom } = getReasons(settings)
  return keys.length > 0 || !!custom
}
