// First-run guided tour: config + persistence.
const DONE_KEY = 'st_tour_v1_done'
const REPLAY_KEY = 'st_tour_replay'

// Ordered steps. `target` matches a data-tour="<target>" attribute on Home.
export const TOUR_STEPS = [
  { target: 'goal',   title: 'Your goal',        body: 'This badge shows the mode you chose — Aware, Reduce, or Quit. It decides how your targets and streaks are measured. Tap the ⓘ anywhere for a quick explanation.' },
  { target: 'orb',    title: 'Today at a glance', body: 'The circle reflects today. Green means you’re on track; red means you’ve gone over. The number is how many you’ve logged today.' },
  { target: 'streak', title: 'Your streaks',      body: 'On the left, your best recent run of on-target days — momentum you can build. On the right, a nudge if you’ve been smoking several days running.' },
  { target: 'log',    title: 'Log in one tap',    body: 'Tap to record a cigarette instantly. Press and hold to add brand, mood, or trigger — that’s what powers your pattern insights.' },
  { target: 'pills',  title: 'Your key numbers',  body: 'Today’s spend, how often you hit your goal over 30 days, and the long-term cost if nothing changes.' },
  { target: 'nav',    title: 'Explore more',      body: 'Use the tabs to see your calendar, deeper insights, and settings. Every metric has a ⓘ you can tap to learn what it means. You’re all set!' },
]

export function isTourDone() {
  try { return localStorage.getItem(DONE_KEY) === '1' } catch { return true }
}
export function markTourDone() {
  try { localStorage.setItem(DONE_KEY, '1'); localStorage.removeItem(REPLAY_KEY) } catch { /* ignore */ }
}
// Settings triggers a replay: clear done + set replay flag, then go to Home.
export function requestTourReplay() {
  try { localStorage.removeItem(DONE_KEY); localStorage.setItem(REPLAY_KEY, '1') } catch { /* ignore */ }
}
export function shouldShowTour() {
  try { return localStorage.getItem(REPLAY_KEY) === '1' || localStorage.getItem(DONE_KEY) !== '1' } catch { return false }
}
