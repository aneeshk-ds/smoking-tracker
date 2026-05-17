import { useEffect, useState } from 'react'
import {
  getAllCigarettes,
  getAllDayStats,
  getSettings,
  getLastCigaretteTime,
  getCurrentStreakHonest,
} from '../lib/storage'
import {
  computeAchievementStats,
  computeUnlockedBadges,
  computeShieldStatus,
  buildCalendarGrid,
} from '../lib/achievements'
import {
  MILESTONES,
  splitMilestones,
  getNextMilestoneProgress,
  timeUntilLabel,
} from '../lib/health-milestones'
import AchievementBadge from '../components/AchievementBadge'
import BottomNav from '../components/BottomNav'

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
      {subtitle && (
        <p className="text-xs font-normal mt-0.5" style={{ color: 'var(--muted)' }}>{subtitle}</p>
      )}
    </div>
  )
}

// ── Streak summary card ───────────────────────────────────────────────────────

function StreakSummaryCard({ streak, shield, weekXP }) {
  if (!streak || streak.mode === 'awareness') {
    return (
      <div className="card p-5">
        <p className="text-sm font-normal" style={{ color: 'var(--muted)' }}>
          Set a goal in Settings to unlock streaks
        </p>
      </div>
    )
  }

  const current = streak.currentRun ?? streak.daysSinceLast ?? 0
  const best    = streak.bestRun ?? streak.personalBest ?? 0

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, #1a2e50 0%, #1e1b40 100%)',
        border: '1px solid rgba(232,168,56,0.2)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: 36 }}>🔥</span>
            <span className="streak-number" style={{ color: '#E8A838' }}>{current}</span>
            <span className="text-lg font-bold" style={{ color: 'var(--muted)' }}>
              {current === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="text-sm font-normal mt-1" style={{ color: 'var(--muted)' }}>
            current streak
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {shield?.available && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(74,222,128,0.12)',
                color: '#4ADE80',
                border: '1px solid rgba(74,222,128,0.25)',
              }}
            >
              <span style={{ fontSize: 13 }}>🛡</span>
              Shield ready
            </div>
          )}
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(232,168,56,0.1)',
              color: '#E8A838',
            }}
          >
            Best: {best}d
          </div>
        </div>
      </div>

      {weekXP > 0 && (
        <div
          className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>
            This week's score
          </span>
          <span className="text-sm font-bold" style={{ color: '#E8A838' }}>
            {weekXP} pts
          </span>
        </div>
      )}
    </div>
  )
}

// ── Calendar grid ─────────────────────────────────────────────────────────────

function CalendarGrid({ grid }) {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const dotColor = {
    success: '#4ADE80',
    warning: '#FBBF24',
    danger:  '#F87171',
    logged:  '#6366F1',
    empty:   'var(--surface-2)',
    future:  'transparent',
  }

  return (
    <div>
      {/* Day labels */}
      <div className="flex gap-1 mb-1 pl-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="w-5 text-center" style={{ fontSize: 9, color: 'var(--dim)', fontWeight: 400 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid: each column = 1 week */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className="w-5 h-5 rounded-[4px]"
                style={{
                  background: day.status === 'future'
                    ? 'transparent'
                    : dotColor[day.status] ?? 'var(--surface-2)',
                  border: day.status === 'empty' || day.status === 'future'
                    ? '1px solid var(--border)'
                    : 'none',
                  opacity: day.status === 'future' ? 0 : 1,
                }}
                title={day.date + (day.count !== null ? ` · ${day.count}` : '')}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: '#4ADE80', label: 'On target' },
          { color: '#F87171', label: 'Over target' },
          { color: 'var(--surface-2)', label: 'No data', border: true },
        ].map(({ color, label, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                background: color,
                border: border ? '1px solid var(--border)' : 'none',
              }}
            />
            <span className="text-[10px] font-normal" style={{ color: 'var(--dim)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Health milestone card ─────────────────────────────────────────────────────

function MilestoneCard({ milestone, reached }) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl"
      style={{
        background: reached ? 'rgba(74,222,128,0.06)' : 'var(--surface)',
        border: reached ? '1px solid rgba(74,222,128,0.2)' : '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{
          width: 40,
          height: 40,
          background: reached ? 'rgba(74,222,128,0.12)' : 'var(--surface-2)',
        }}
      >
        <span style={{ fontSize: 18 }}>{reached ? '✓' : '○'}</span>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: reached ? '#4ADE80' : 'var(--text)' }}>
            {milestone.title}
          </span>
          <span
            className="text-xs font-normal px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--muted)',
            }}
          >
            {milestone.label}
          </span>
        </div>
        <p className="text-xs font-normal mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>
          {milestone.body}
        </p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Journey() {
  const [data, setData] = useState(null)

  useEffect(() => {
    async function load() {
      const [cigs, dayStats, settings, lastTs, streak] = await Promise.all([
        getAllCigarettes(),
        getAllDayStats(),
        getSettings(),
        getLastCigaretteTime(),
        getCurrentStreakHonest(),
      ])

      const stats  = computeAchievementStats(cigs, dayStats, settings)
      const badges = computeUnlockedBadges(stats)
      const shield = computeShieldStatus(dayStats, settings)
      const grid   = buildCalendarGrid(dayStats, settings, 12)

      // Health milestones
      const elapsed   = lastTs ? Date.now() - lastTs : 0
      const totalMin  = Math.floor(elapsed / 60000)
      const { reached, upcoming } = lastTs
        ? splitMilestones(totalMin)
        : { reached: [], upcoming: MILESTONES }

      setData({
        badges,
        shield,
        grid,
        streak,
        weekXP: stats.weekXP,
        reached,
        upcoming: upcoming.slice(0, 5),
        lastTs,
        goal: settings?.goal ?? 'awareness',
      })
    }
    load()
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
      </div>
    )
  }

  const unlockedCount = data.badges.filter((b) => b.unlocked).length

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: 'var(--bg)' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-5 pt-8 pb-4 max-w-md mx-auto w-full"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Journey</h1>
      </div>

      <div className="flex-1 px-5 pt-5 max-w-md mx-auto w-full flex flex-col gap-8">

        {/* Streak summary */}
        <section>
          <SectionHeader title="Streak" subtitle="consecutive days on target" />
          <StreakSummaryCard streak={data.streak} shield={data.shield} weekXP={data.weekXP} />
        </section>

        {/* Achievements */}
        <section>
          <SectionHeader
            title="Achievements"
            subtitle={`${unlockedCount} of ${data.badges.length} unlocked`}
          />
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {data.badges.map((badge) => (
              <div key={badge.id} className="shrink-0">
                <AchievementBadge badge={badge} />
              </div>
            ))}
          </div>
        </section>

        {/* Calendar */}
        <section>
          <SectionHeader title="12-Week Record" />
          <div
            className="p-4 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <CalendarGrid grid={data.grid} />
          </div>
        </section>

        {/* Health milestones */}
        {data.goal === 'quit' && (
          <section>
            {data.reached.length > 0 && (
              <div className="mb-6">
                <SectionHeader
                  title="Recovery Unlocked"
                  subtitle={`${data.reached.length} milestone${data.reached.length !== 1 ? 's' : ''} reached`}
                />
                <div className="flex flex-col gap-2">
                  {[...data.reached].reverse().map((m) => (
                    <MilestoneCard key={m.id} milestone={m} reached />
                  ))}
                </div>
              </div>
            )}

            {data.upcoming.length > 0 && (
              <div>
                <SectionHeader title="Coming Up" subtitle="next recovery milestones" />
                <div className="flex flex-col gap-2">
                  {data.upcoming.map((m) => (
                    <MilestoneCard key={m.id} milestone={m} reached={false} />
                  ))}
                </div>
              </div>
            )}

            {!data.lastTs && (
              <div
                className="p-5 rounded-2xl text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-sm font-normal" style={{ color: 'var(--muted)' }}>
                  Your recovery timeline starts from your last cigarette.
                  Keep the app updated and the milestones unlock as time passes.
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
