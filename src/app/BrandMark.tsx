/** EffiQuest mark: a lever on a fulcrum inside a square, drawn in the icon style. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="6" style={{ fill: 'var(--brand)' }} />
      <g
        style={{ stroke: 'var(--brand-ink)' }}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M6 19.5 26 15.5" />
        <path d="m16 17.5-3.5 7h7z" />
      </g>
      <circle cx="23.5" cy="12.6" r="2.4" style={{ fill: 'var(--brand-ink)' }} />
    </svg>
  );
}

export function BrandName({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark size={compact ? 28 : 32} />
      <span className="leading-tight">
        <span className="block font-display text-lg">EffiQuest</span>
        {compact ? null : (
          <span className="block font-mono text-[0.65rem] tracking-[0.14em] text-muted uppercase">
            Efficiency lab
          </span>
        )}
      </span>
    </span>
  );
}
