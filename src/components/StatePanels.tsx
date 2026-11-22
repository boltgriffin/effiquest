import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons/Icon';
import { cx } from '@/utils/cx';
import { Button, ButtonLink } from './ui/Button';

interface StateProps {
  icon: IconName;
  iconClass: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert';
  compact?: boolean;
  /** Use 1 when the state replaces the whole page, so the page still has a top-level heading. */
  level?: 1 | 2;
}

/** Shared layout for empty / error / success / not-found: left-aligned, ruled, no illustration filler. */
function StateBlock({
  icon,
  iconClass,
  title,
  children,
  action,
  role,
  compact,
  level = 2,
}: StateProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <div
      role={role}
      className={cx(
        'flex gap-4 rounded-md border border-dashed border-rule-strong bg-surface',
        compact ? 'p-4' : 'mx-auto max-w-xl p-6',
      )}
    >
      <span className={cx('mt-0.5 shrink-0', iconClass)}>
        <Icon name={icon} size={compact ? 20 : 24} />
      </span>
      <div className="min-w-0">
        <Heading className={cx('font-display', compact ? 'text-base' : 'text-xl')}>{title}</Heading>
        {children ? <div className="mt-1 text-sm text-muted">{children}</div> : null}
        {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 p-6 text-muted">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-rule-strong border-t-brand"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  icon = 'layers',
  compact,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: IconName;
  compact?: boolean;
}) {
  return (
    <StateBlock icon={icon} iconClass="text-muted" title={title} action={action} compact={compact}>
      {children}
    </StateBlock>
  );
}

export function SuccessState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <StateBlock icon="check" iconClass="text-success" title={title} role="status" compact>
      {children}
    </StateBlock>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <StateBlock
      icon="alert"
      iconClass="text-danger"
      title={title}
      role="alert"
      action={
        onRetry ? (
          <Button variant="primary" icon="reset" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    >
      {message}
    </StateBlock>
  );
}

export function NotFoundState() {
  return (
    <StateBlock
      level={1}
      icon="help"
      iconClass="text-muted"
      title="Page not found"
      action={
        <ButtonLink to="/" variant="primary" icon="home">
          Back to dashboard
        </ButtonLink>
      }
    >
      That page does not exist. Check the address or return to the dashboard.
    </StateBlock>
  );
}

/** For areas this device is not set up to show (e.g. teacher tools while teacher mode is off). */
export function UnauthorizedState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <StateBlock level={1} icon="lock" iconClass="text-warning" title={title} action={action}>
      {children}
    </StateBlock>
  );
}
