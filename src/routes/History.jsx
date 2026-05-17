import { useEffect, useState, useCallback } from 'react'
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns'
import {
  getCigarettesByRange,
  deleteCigarette,
  getSettings,
} from '../lib/storage'
import { performBackup } from '../lib/backup'
import BottomNav from '../components/BottomNav'
import EditEntryModal from '../components/EditEntryModal'

const FILTERS = ['Today', 'Week', 'Month', 'All']

function getRange(filter) {
  const now = Date.now()
  const today = new Date()
  if (filter === 'Today')  return [startOfDay(today).getTime(), endOfDay(today).getTime()]
  if (filter === 'Week')   return [startOfWeek(today, { weekStartsOn: 1 }).getTime(), now]
  if (filter === 'Month')  return [startOfMonth(today).getTime(), now]
  return [0, now]
}

function groupByDay(entries) {
  const map = {}
  for (const e of entries) {
    const day = format(new Date(e.timestamp), 'yyyy-MM-dd')
    if (!map[day]) map[day] = []
    map[day].push(e)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

function EntryRow({ entry, onDelete, onEdit }) {
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    await deleteCigarette(entry.id)
    performBackup().catch(() => {})
    onDelete()
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        {/* Time */}
        <span className="text-sm font-bold w-12 shrink-0" style={{ color: 'var(--text)' }}>
          {format(new Date(entry.timestamp), 'HH:mm')}
        </span>
        {/* Meta */}
        <div className="flex flex-col gap-0.5">
          {entry.brand && (
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {entry.brand}
            </span>
          )}
          <div className="flex flex-wrap gap-1">
            {entry.mood && (
              <Tag label={entry.mood} color="var(--accent)" />
            )}
            {entry.trigger && (
              <Tag label={entry.trigger} color="var(--muted)" />
            )}
            {entry.location && (
              <Tag label={entry.location} color="var(--dim)" />
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <button
          onClick={() => onEdit(entry)}
          className="text-xs font-normal px-2 py-1 rounded-lg transition-all"
          style={{ color: 'var(--muted)', background: 'var(--surface)' }}
        >
          edit
        </button>
        <button
          onClick={handleDelete}
          className="text-xs font-normal px-2 py-1 rounded-lg transition-all"
          style={{
            color: confirming ? 'var(--danger)' : 'var(--dim)',
            background: confirming ? 'rgba(248,113,113,0.1)' : 'var(--surface)',
          }}
          onBlur={() => setConfirming(false)}
        >
          {confirming ? 'confirm' : 'delete'}
        </button>
      </div>
    </div>
  )
}

function Tag({ label, color }) {
  return (
    <span
      className="text-[10px] font-normal px-1.5 py-0.5 rounded-md"
      style={{ background: 'var(--surface)', color, border: '1px solid var(--border)' }}
    >
      {label}
    </span>
  )
}

function DaySection({ date, items, onDelete, onEdit }) {
  const d = new Date(date + 'T12:00:00')
  const isToday = format(new Date(), 'yyyy-MM-dd') === date
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {isToday ? 'Today' : format(d, 'EEEE, d MMM')}
        </span>
        <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>
          {items.length} {items.length === 1 ? 'cigarette' : 'cigarettes'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((e) => (
          <EntryRow key={e.id} entry={e} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}

export default function History() {
  const [filter, setFilter]       = useState('Today')
  const [groups, setGroups]       = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [editEntry, setEditEntry] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const [start, end] = getRange(filter)
    const entries = await getCigarettesByRange(start, end)
    const sorted  = [...entries].sort((a, b) => b.timestamp - a.timestamp)
    setGroups(groupByDay(sorted))
    setTotal(sorted.length)
    setLoading(false)
  }, [filter, refreshKey])

  useEffect(() => { load() }, [load])

  const handleDelete = () => setRefreshKey((k) => k + 1)
  const handleEditDone = () => {
    setEditEntry(null)
    setRefreshKey((k) => k + 1)
    performBackup().catch(() => {})
  }

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 pt-8 pb-4"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4 max-w-md mx-auto">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            History
          </h1>
          <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>
            {total} total
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 max-w-md mx-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={
                filter === f
                  ? { background: 'var(--accent)', color: '#0D1420' }
                  : { background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span style={{ fontSize: 40 }}>📋</span>
            <p className="text-base font-semibold" style={{ color: 'var(--muted)' }}>
              Nothing logged {filter === 'Today' ? 'today' : `this ${filter.toLowerCase()}`}
            </p>
            <p className="text-sm font-normal text-center" style={{ color: 'var(--dim)' }}>
              Use the home screen to log a cigarette
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(({ date, items }) => (
              <DaySection
                key={date}
                date={date}
                items={items}
                onDelete={handleDelete}
                onEdit={setEditEntry}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={handleEditDone}
        />
      )}
    </div>
  )
}
