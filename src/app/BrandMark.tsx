import { MARK } from './brandMarkSvg';

/** EffiQuest mark in the brand tokens, so it follows light/dark. Drawing: brandMarkSvg.ts. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox={MARK.viewBox} aria-hidden="true" focusable="false">
      <rect
        width={MARK.size}
        height={MARK.size}
        rx={MARK.radius}
        style={{ fill: 'var(--brand)' }}
      />
      <g
        style={{ stroke: 'var(--brand-ink)' }}
        strokeWidth={MARK.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d={MARK.beam} />
        <path d={MARK.fulcrum} />
      </g>
      <circle
        cx={MARK.load.cx}
        cy={MARK.load.cy}
        r={MARK.load.r}
        style={{ fill: 'var(--brand-ink)' }}
      />
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
