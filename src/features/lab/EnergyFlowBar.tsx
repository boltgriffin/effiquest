import { cx } from '@/utils/cx';
import { formatQuantity } from '@/utils/format';

interface Loss {
  label: string;
  joules: number;
}

interface EnergyFlowBarProps {
  inputJ: number;
  usefulJ: number;
  /** Named losses. Defaults to one friction loss (input − useful). */
  losses?: Loss[];
}

/** Friction keeps the crimson hatch; other losses use a neutral dotted texture. */
const lossStyle = (label: string) =>
  /friction/i.test(label)
    ? 'hatch-loss'
    : 'bg-rule-strong/60 [background-image:radial-gradient(var(--surface)_1px,transparent_1.5px)] [background-size:6px_6px]';

/**
 * Splits input work into useful work and losses: the core picture against the "perfect machine"
 * idea. Every part is labelled with its value; textures as well as colours tell them apart.
 */
export function EnergyFlowBar({ inputJ, usefulJ, losses }: EnergyFlowBarProps) {
  const parts: Loss[] = (
    losses ?? [{ label: 'Lost (friction)', joules: Math.max(0, inputJ - usefulJ) }]
  ).filter((l) => l.joules > 1e-9);
  const pct = (j: number) => (inputJ > 0 ? (j / inputJ) * 100 : 0);
  const summary = `Input work ${formatQuantity(inputJ, 2)} joules: ${formatQuantity(usefulJ, 2)} joules useful${parts
    .map((l) => `, ${formatQuantity(l.joules, 2)} joules ${l.label.toLowerCase()}`)
    .join('')}.`;
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between text-sm">
        <span className="font-medium">Where the input work goes</span>
        <span className="num text-muted">
          W<sub>in</sub> = {formatQuantity(inputJ, 2)} J
        </span>
      </figcaption>
      <div role="img" aria-label={summary} className="flex h-6 gap-0.5 overflow-hidden rounded-sm">
        <div className="h-full rounded-l-sm bg-output" style={{ width: `${pct(usefulJ)}%` }} />
        {parts.map((l, i) => (
          <div
            key={l.label}
            className={cx('h-full', lossStyle(l.label), i === parts.length - 1 && 'rounded-r-sm')}
            style={{ width: `${pct(l.joules)}%` }}
          />
        ))}
      </div>
      <ul
        aria-hidden="true"
        className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-4"
      >
        <li className="flex items-center gap-2 whitespace-nowrap">
          <span className="size-3 rounded-sm bg-output" />
          Useful work <span className="num text-muted">{formatQuantity(usefulJ, 2)} J</span>
        </li>
        {parts.map((l) => (
          <li key={l.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className={cx('size-3 rounded-sm', lossStyle(l.label))} />
            {l.label} <span className="num text-muted">{formatQuantity(l.joules, 2)} J</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
