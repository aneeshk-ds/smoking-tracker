// Central plain-language help copy for the tooltip (ⓘ) system.
// Keep each entry short, concrete, and jargon-free — a new user should get it
// in one read. { label } shows as the popover heading, { text } as the body.

export const HELP = {
  // ── Home ──
  goal: {
    label: 'Your goal',
    text: 'The mode you chose: Aware (just tracking), Reduce (staying under a daily limit), or Quit (aiming for zero). It changes how targets and streaks are measured. Change it anytime in Settings.',
  },
  orb: {
    label: 'Today at a glance',
    text: 'The circle reflects today. Green means you’re on track for your goal (smoke-free, or within your limit). Red means you’ve gone over. The number is how many you’ve logged today.',
  },
  streak: {
    label: 'Your streaks',
    text: 'The left figure is your best recent run of on-target days (smoke-free, or under your limit). It shows momentum — the longer it grows, the better you’re doing.',
  },
  smokingRun: {
    label: 'Current run',
    text: 'How many days in a row you’ve been smoking. Seeing this climb is a nudge to break the pattern.',
  },
  reason: {
    label: 'Why you’re doing this',
    text: 'The reasons you picked for cutting down or quitting. They show up here as a reminder in the moments that matter. Edit them in Settings.',
  },
  logButton: {
    label: 'Log a cigarette',
    text: 'Tap once to record one instantly. Press and hold to add details first — brand, mood, or what triggered it — which powers the pattern insights.',
  },
  craving: {
    label: 'Beat a craving',
    text: 'Tap when the urge hits. It starts a short 10-minute delay with something to do — most cravings pass in a few minutes, and riding one out builds control.',
  },
  spendToday: {
    label: 'Spent today',
    text: 'What today’s cigarettes have cost, based on your brand’s price. A small, real number that adds up fast.',
  },
  onTargetRate: {
    label: 'On-target rate (30 days)',
    text: 'The share of the last 30 days you hit your goal — smoke-free days if you’re quitting, or days under your limit if you’re reducing. Above 70% shows in green.',
  },
  projectedCost: {
    label: '10-year cost',
    text: 'If your current pace continued for 10 years, this is roughly what you’d spend. It’s a projection to make the long-term cost tangible — not a bill.',
  },
  insight: {
    label: 'Pattern insight',
    text: 'An automatic observation from your logs — like your most common trigger or the time of day you smoke most. The more you log, the sharper these get.',
  },
  todayLog: {
    label: 'Today’s log',
    text: 'Every cigarette you’ve recorded today, newest first. Tap an entry to edit or remove it.',
  },

  // ── Journey (calendar) ──
  calendar: {
    label: 'Your calendar',
    text: 'Each square is a day. Colour shows how that day went against your goal, so you can spot good stretches and rough patches at a glance.',
  },
  legendOnTarget: {
    label: 'On target',
    text: 'A day you met your goal — at or under your daily target (or smoke-free if you’re quitting). Darker green = more cigarettes that day, but still on target.',
  },
  legendOverTarget: {
    label: 'Over target',
    text: 'A day you went past your target. The darker the red, the further over your limit you went.',
  },
  legendFewer: {
    label: 'Fewer',
    text: 'A lighter square means fewer cigarettes that day.',
  },
  legendMore: {
    label: 'More',
    text: 'A darker square means more cigarettes that day.',
  },
  dailyTarget: {
    label: 'Daily target',
    text: 'Your limit for a single day. Days at or under it count as on target; days over it count as over. Adjust it right here, or in Settings → Goal. If your goal is Quit, the target is zero.',
  },
  legendNoData: {
    label: 'No data',
    text: 'A day with nothing logged. It doesn’t count for or against you — it just means the day wasn’t recorded.',
  },

  // ── Insights ──
  insTotal: { label: 'Total', text: 'Cigarettes logged across the selected period.' },
  insAvg: { label: 'Average per day', text: 'Total cigarettes divided by the number of days — your typical daily pace.' },
  insSpent: { label: 'Spent', text: 'Total money spent on cigarettes in this period, from your brand prices.' },
  insSaved: { label: 'Saved', text: 'Estimated money you avoided spending by smoking less than your original baseline.' },
  insPeak: { label: 'Peak hour', text: 'The time of day you light up most often — handy for planning where to intervene.' },
  insWeekSplit: { label: 'Weekday vs weekend', text: 'Compares how much you smoke on weekdays versus weekends, to reveal situational habits.' },
  insWhen: { label: 'When you smoke', text: 'Your cigarettes spread across the hours of the day, so you can see your daily rhythm.' },
  insDaily: { label: 'Daily count', text: 'Cigarettes per day over time. If you set a limit, the target line shows whether you’re under it.' },
  insTriggers: { label: 'Triggers', text: 'What you tagged as the reason — stress, coffee, boredom — ranked by how often. Log triggers to fill this in.' },
  insLocations: { label: 'Locations', text: 'Where you smoke most, ranked. Useful for spotting the places tied to the habit.' },
  insCraving: { label: 'Craving intensity', text: 'The average strength of the cravings you recorded each day. Lower over time means the urges are easing.' },
  insProjection: { label: 'If nothing changes', text: 'Projected future spend if your current pace held steady — a look at the long-term cost.' },

  // ── Health ──
  healthReached: { label: 'Reached', text: 'Recovery milestones your body has already passed since your last cigarette — from minutes to months.' },
  healthUpcoming: { label: 'Upcoming', text: 'Health milestones still ahead. Each shows what improves and when, to give the next stretch a purpose.' },

  // ── Settings ──
  setGoal: { label: 'Goal', text: 'Switch between Aware, Reduce, and Quit. Reduce lets you set a daily limit; Quit aims for zero. This drives your targets and streaks.' },
  setBrand: { label: 'Default brand', text: 'The brand used when you log quickly. Pick one, edit its price, or add your own — it sets the cost of each cigarette.' },
  setPurchase: { label: 'Purchase type', text: 'Whether you usually buy by the pack or as singles. It decides which price is used to cost each cigarette.' },
  setCurrency: { label: 'Currency', text: 'The currency all money figures are shown in.' },
  setAppearance: { label: 'Appearance', text: 'Light, dark, or match your system. Changes the whole app instantly.' },
  setReasons: { label: 'Your reasons', text: 'The motivations shown on your home screen. Pick from the list or write your own — change them whenever they change.' },
  setBackup: { label: 'Backup & sync', text: 'Sign in to back your data up to your account and keep it synced across devices — like any app. Nothing to export by hand.' },
  setDemo: { label: 'Demo data', text: 'Loads 30 days of realistic sample entries so you can see how the charts and metrics look with data. Clear all data to remove it.' },
  setReplayTour: { label: 'Replay the tour', text: 'Runs the quick guided walkthrough of the home screen again.' },
}
