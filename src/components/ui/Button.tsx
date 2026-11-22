import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icon, type IconName } from '@/components/icons/Icon';
import { cx } from '@/utils/cx';
import { buttonClass, type ButtonSize, type ButtonVariant } from './styles';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

export function Button({
  variant,
  size,
  icon,
  iconRight,
  children,
  className,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cx(buttonClass(variant, size), className)} {...rest}>
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={18} /> : null}
    </button>
  );
}

/** A navigation link styled as a button. Use when the action changes the page. */
export function ButtonLink({
  variant,
  size,
  icon,
  iconRight,
  children,
  className,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link className={cx(buttonClass(variant, size), className)} {...rest}>
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={18} /> : null}
    </Link>
  );
}

/** Square icon-only button; `label` is required so it is never unlabeled. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  className,
  ...rest
}: { icon: IconName; label: string; variant?: ButtonVariant } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(buttonClass(variant, 'md'), 'w-11 px-0', className)}
      {...rest}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}
