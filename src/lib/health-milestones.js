// WHO / CDC / NHS smoking cessation recovery milestones.
// minutesRequired = elapsed smoke-free minutes needed to reach this milestone.

export const MILESTONES = [
  {
    id: '20m',
    label: '20 min',
    minutesRequired: 20,
    title: 'Heart rate normalises',
    body: 'Blood pressure and pulse rate drop back to your natural baseline.',
    source: 'WHO / NHS',
  },
  {
    id: '8h',
    label: '8 hours',
    minutesRequired: 8 * 60,
    title: 'Carbon monoxide clears',
    body: 'CO in your blood drops by 50% and oxygen levels begin to restore.',
    source: 'NHS',
  },
  {
    id: '24h',
    label: '24 hours',
    minutesRequired: 24 * 60,
    title: 'Heart attack risk falls',
    body: 'Your risk of a heart attack begins to decrease after just one day.',
    source: 'CDC',
  },
  {
    id: '48h',
    label: '48 hours',
    minutesRequired: 48 * 60,
    title: 'Taste and smell return',
    body: 'Nerve endings start regrowing. Food tastes sharper. Scents clearer.',
    source: 'NHS',
  },
  {
    id: '72h',
    label: '72 hours',
    minutesRequired: 72 * 60,
    title: 'Breathing gets easier',
    body: 'Bronchial tubes relax, lung capacity increases, energy improves.',
    source: 'CDC',
  },
  {
    id: '2w',
    label: '2 weeks',
    minutesRequired: 14 * 24 * 60,
    title: 'Circulation improves',
    body: 'Lung function up ~30%. Walking and exercise become noticeably easier.',
    source: 'NHS',
  },
  {
    id: '1mo',
    label: '1 month',
    minutesRequired: 30 * 24 * 60,
    title: 'Coughing subsides',
    body: 'Cilia in lungs regrow. Mucus clears. Persistent cough reduces.',
    source: 'CDC',
  },
  {
    id: '3mo',
    label: '3 months',
    minutesRequired: 90 * 24 * 60,
    title: 'Lung function +10%',
    body: 'Chronic breathlessness and cough reduce significantly.',
    source: 'WHO',
  },
  {
    id: '9mo',
    label: '9 months',
    minutesRequired: 270 * 24 * 60,
    title: 'Lungs significantly healed',
    body: 'Sinuses clear. Cilia fully restored. Respiratory infections drop.',
    source: 'NHS',
  },
  {
    id: '1yr',
    label: '1 year',
    minutesRequired: 365 * 24 * 60,
    title: 'Heart disease risk halved',
    body: 'Your risk of coronary heart disease is now half that of a smoker.',
    source: 'CDC / WHO',
  },
  {
    id: '5yr',
    label: '5 years',
    minutesRequired: 5 * 365 * 24 * 60,
    title: 'Stroke risk = non-smoker',
    body: 'Stroke risk reduces to the same as someone who has never smoked.',
    source: 'CDC',
  },
  {
    id: '10yr',
    label: '10 years',
    minutesRequired: 10 * 365 * 24 * 60,
    title: 'Lung cancer risk halved',
    body: 'Lung cancer death rate drops by 50%. Mouth and throat cancer risk falls.',
    source: 'WHO / CDC',
  },
  {
    id: '15yr',
    label: '15 years',
    minutesRequired: 15 * 365 * 24 * 60,
    title: 'Heart risk = non-smoker',
    body: 'Risk of coronary heart disease is now the same as a lifelong non-smoker.',
    source: 'CDC / WHO',
  },
]

// Split milestones into reached / upcoming based on elapsed minutes.
export function splitMilestones(minutesSinceLast) {
  const reached = MILESTONES.filter((m) => minutesSinceLast >= m.minutesRequired)
  const upcoming = MILESTONES.filter((m) => minutesSinceLast < m.minutesRequired)
  return { reached, upcoming }
}

// Progress toward the next milestone (0-100%) and the milestone itself.
export function getNextMilestoneProgress(minutesSinceLast) {
  const upcomingIdx = MILESTONES.findIndex((m) => minutesSinceLast < m.minutesRequired)
  if (upcomingIdx === -1) return { next: null, progress: 100 }

  const next = MILESTONES[upcomingIdx]
  const prev = upcomingIdx > 0 ? MILESTONES[upcomingIdx - 1] : { minutesRequired: 0 }
  const span = next.minutesRequired - prev.minutesRequired
  const done = minutesSinceLast - prev.minutesRequired
  const progress = span > 0 ? Math.max(0, Math.min(100, Math.round((done / span) * 100))) : 0
  return { next, progress }
}

// Human-readable "in X" label for upcoming milestones.
export function timeUntilLabel(minutesRequired, currentMinutes) {
  const rem = minutesRequired - currentMinutes
  if (rem <= 0) return 'reached'
  if (rem < 60) return `in ${rem}m`
  if (rem < 1440) return `in ${Math.round(rem / 60)}h`
  if (rem < 10080) return `in ${Math.round(rem / 1440)}d`
  if (rem < 43200) return `in ${Math.round(rem / 10080)}wk`
  const months = Math.round(rem / 43200)
  if (months < 24) return `in ${months}mo`
  return `in ${Math.round(months / 12)}yr`
}
