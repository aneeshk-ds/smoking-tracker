// A named companion the user is accountable to. Chosen + named by the user; its
// mood tracks how they're doing and it speaks to them in the first person.
// Kept supportive and adult — a presence you keep alive, not a cartoon mascot.

export const COMPANION_TYPES = [
  { id: 'sprout', emoji: '🌱', label: 'Sprout', blurb: 'grows as you stay on track' },
  { id: 'ember',  emoji: '🔥', label: 'Ember',  blurb: 'burns brighter with momentum' },
  { id: 'lung',   emoji: '🫁', label: 'Breath', blurb: 'heals a little every clean day' },
]

const EMOJI = Object.fromEntries(COMPANION_TYPES.map((t) => [t.id, t.emoji]))
export function companionEmoji(type) { return EMOJI[type] || '🌱' }

export function getCompanion(settings) {
  const c = settings?.companion
  return { enabled: !!c?.enabled, type: c?.type || 'sprout', name: (c?.name || '').trim() || 'Buddy' }
}

// Pure: companion mood from today's state + recent on-target rate.
export function companionMood({ count = 0, goal = 'awareness', dailyTarget = null, onTargetRate = null }) {
  const onToday = goal === 'quit' ? count === 0 : (dailyTarget != null ? count <= dailyTarget : null)
  if (onToday === false) return 'struggling'
  if (onTargetRate != null && onTargetRate < 40) return 'struggling'
  if (onToday === true && (onTargetRate == null || onTargetRate >= 65)) return 'thriving'
  return 'ok'
}

// Pure: the companion's first-person line for the given state.
export function companionLine({ name = 'Buddy', type = 'sprout', mood = 'ok', count = 0, goal = 'awareness', dailyTarget = null, hour = new Date().getHours() }) {
  const n = name || 'Buddy'
  const e = companionEmoji(type)
  if (mood === 'thriving') {
    if (hour >= 20) {
      return goal === 'quit'
        ? `${n}: Smoke-free again today — you're keeping me alive. Thank you. ${e}`
        : `${n}: We stayed under ${dailyTarget} today (${count}). Proud of us. ${e}`
    }
    return `${n}: We're on a good run — let's protect it today. ${e}`
  }
  if (mood === 'struggling') {
    return `${n}: A tough stretch, but I'm not going anywhere. One better choice and we're back.`
  }
  if (!count && hour >= 11) return `${n}: New day, clean slate. Let's take it easy together.`
  return `${n}: I'm here with you — log as you go and we'll keep it honest.`
}
