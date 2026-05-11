// Shows a subtle backup reminder when > 30 days have passed since last export.
// Only shown when the user has enabled the reminder in Settings.

const BACKUP_REMINDER_KEY = 'trackerBackupReminder'
const LAST_EXPORT_KEY = 'trackerLastExportAt'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export default function BackupBanner() {
  const enabled = localStorage.getItem(BACKUP_REMINDER_KEY) === '1'
  if (!enabled) return null

  const lastExport = parseInt(localStorage.getItem(LAST_EXPORT_KEY) || '0', 10)
  const overdue = !lastExport || Date.now() - lastExport > THIRTY_DAYS_MS
  if (!overdue) return null

  const daysSince = lastExport
    ? Math.floor((Date.now() - lastExport) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div
      className="px-4 pt-2"
      style={{ maxWidth: 448, margin: '0 auto', width: '100%' }}
    >
      <div
        className="rounded-xl px-4 py-2.5 flex items-center gap-3"
        style={{
          backgroundColor: 'rgba(255,85,119,0.06)',
          border: '1px solid rgba(255,85,119,0.2)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-danger text-[10px] font-mono">
            {daysSince
              ? `No backup in ${daysSince} days.`
              : 'You have not exported your data yet.'}{' '}
            <a
              href="/settings"
              className="underline"
              style={{ color: 'var(--danger)' }}
            >
              Export now
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// Call this whenever the user exports data
export function markExported() {
  localStorage.setItem(LAST_EXPORT_KEY, String(Date.now()))
}

// Call this to toggle the reminder on/off
export function setBackupReminder(enabled) {
  if (enabled) {
    localStorage.setItem(BACKUP_REMINDER_KEY, '1')
  } else {
    localStorage.removeItem(BACKUP_REMINDER_KEY)
  }
}

export function isBackupReminderEnabled() {
  return localStorage.getItem(BACKUP_REMINDER_KEY) === '1'
}
