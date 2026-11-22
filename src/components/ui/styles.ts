import { cx } from '@/utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ' +
  'transition-[background-color,border-color,color] duration-150 ease-standard ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-ink hover:bg-brand/90 active:bg-brand/80',
  secondary:
    'border border-rule-strong bg-surface text-ink hover:border-ink/60 hover:bg-surface-2 active:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2 active:bg-surface-2',
  danger: 'border border-danger/60 text-danger hover:bg-danger/10',
};

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-[0.95rem]',
  sm: 'min-h-9 px-3 text-sm',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return cx(base, variants[variant], sizes[size]);
}

export const inputClass =
  'w-full min-h-11 rounded-md border border-rule-strong bg-surface px-3 text-ink ' +
  'placeholder:text-muted/80 hover:border-ink/50 aria-invalid:border-danger ' +
  'focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-0';

/** Small-caps section label used in panel headers ("01 - Predict"). */
export const eyebrowClass =
  'font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted';
