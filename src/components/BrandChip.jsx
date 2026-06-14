// Tappable chip for pre-loaded Indian brand selection in onboarding

export default function BrandChip({ brand, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(brand)}
      className={`
        px-4 py-2 rounded-xl text-sm font-sans border transition-all duration-150 select-none
        ${selected
          ? 'bg-accent-dim border-accent text-accent'
          : 'bg-surface-2 border-border text-muted hover:border-dim hover:text-text'
        }
      `}
    >
      {brand.name}
    </button>
  )
}
