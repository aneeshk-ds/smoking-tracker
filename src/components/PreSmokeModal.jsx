// Opt-in "pause before you light up" gate. Shown when the user taps Log and the
// pre-smoke pause setting is on. Offers a 10-minute delay before logging.
export default function PreSmokeModal({ onDelay, onLogAnyway, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Craving hitting?</h3>
        <p className="text-sm font-sans mb-5" style={{ color: 'var(--muted)' }}>
          Most cravings pass in a few minutes. Want to wait 10 first? Riding one out builds control.
        </p>
        <button
          onClick={onDelay}
          className="w-full py-3 rounded-2xl text-base font-bold mb-2 active:scale-95 transition-all"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          Start a 10-min delay
        </button>
        <button
          onClick={onLogAnyway}
          className="w-full py-3 rounded-2xl text-sm font-normal"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Log it anyway
        </button>
      </div>
    </div>
  )
}
