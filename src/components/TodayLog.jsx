import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getTodayEntries, deleteCigarette, getSettings } from '../lib/storage'
import EditEntryModal from './EditEntryModal'

export default function TodayLog({ refreshKey, onChanged }) {
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    const [e, s] = await Promise.all([getTodayEntries(), getSettings()])
    setEntries(e)
    setSettings(s)
  }

  useEffect(() => { load() }, [refreshKey])

  if (entries.length === 0) return null

  async function handleDelete(id) {
    await deleteCigarette(id)
    await load()
    onChanged?.()
  }

  return (
    <>
      <div className="mt-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
            Today's log ({entries.length})
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              color: 'var(--dim)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-[10px] font-mono px-1 mb-1" style={{ color: 'var(--dim)' }}>
              tap the pencil to add trigger, mood, or location details
            </p>
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div>
                  <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                    {format(new Date(e.timestamp), 'h:mm a')}
                  </span>
                  {(e.brand || e.location || e.trigger) && (
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--dim)' }}>
                      {[e.brand, e.location, e.trigger].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditing(e)} style={{ color: 'var(--muted)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(e.id)} style={{ color: 'var(--danger)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditEntryModal
          entry={editing}
          settings={settings}
          onSave={async () => {
            setEditing(null)
            await load()
            onChanged?.()
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
