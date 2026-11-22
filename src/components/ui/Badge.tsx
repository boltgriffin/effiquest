import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'sample';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-rule-strong text-muted',
  brand: 'border-brand/50 text-brand',
  success: 'border-success/50 text-success',
  warning: 'border-warning/60 text-warning',
  danger: 'border-danger/60 text-danger',
  // Dashed outline marks placeholder / sample data everywhere in the app.
  sample: 'border-dashed border-warning/70 text-warning',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[0.7rem] font-medium tracking-wide uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Standard label for placeholder content and sample values, so they are never mistaken for real data. */
export function SampleBadge({ children = 'Sample' }: { children?: ReactNode }) {
  return <Badge tone="sample">{children}</Badge>;
}
