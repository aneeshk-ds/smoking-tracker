// Renders the streak value for the home screen StatBlock

export default function HonestStreakDisplay({ streak }) {
  if (!streak || streak.mode === 'awareness') {
    return <span className="text-dim text-sm font-mono">tracking</span>
  }

  if (streak.mode === 'reducing') {
    return (
      <span className="text-sm font-mono text-text">
        {streak.homeLabel}
      </span>
    )
  }

  if (streak.mode === 'quitting') {
    return (
      <span className="text-sm font-mono text-text">
        {streak.homeLabel}
      </span>
    )
  }

  return null
}
