import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons/Icon';
import { cx } from '@/utils/cx';

export type CalloutTone = 'info' | 'success' | 'warning' | 'danger';

const config: Record<CalloutTone, { icon: IconName; bar: string; text: string }> = {
  info: { icon: 'info', bar: 'border-l-brand', text: 'text-brand' },
  success: { icon: 'check', bar: 'border-l-success', text: 'text-success' },
  warning: { icon: 'alert', bar: 'border-l-warning', text: 'text-warning' },
  danger: { icon: 'alert', bar: 'border-l-danger', text: 'text-danger' },
};

interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children?: ReactNode;
  /** 'status' for success/info that appears after an action; 'alert' for errors. */
  role?: 'status' | 'alert';
  className?: string;
}

/** Inline message with a status icon + text (status is never color-only). */
export function Callout({ tone = 'info', title, children, role, className }: CalloutProps) {
  const c = config[tone];
  return (
    <div
      role={role}
      className={cx(
        'flex gap-3 border border-l-4 border-rule bg-surface px-4 py-3',
        c.bar,
        'rounded-r-md',
        className,
      )}
    >
      <Icon name={c.icon} size={20} className={cx('mt-0.5 shrink-0', c.text)} />
      <div className="min-w-0 text-sm">
        {title ? <p className="font-medium text-ink">{title}</p> : null}
        {children ? <div className="text-muted">{children}</div> : null}
      </div>
    </div>
  );
}
