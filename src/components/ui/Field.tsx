import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '@/utils/cx';
import { inputClass } from './styles';

interface FieldShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  /** Physical unit shown inside the field and announced with the label (e.g. "J", "N", "%"). */
  unit?: string;
};

/** Text or number input with label, optional unit suffix, hint and validation message. */
export function TextField({ label, hint, error, unit, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={
        unit ? (
          <>
            {label} <span className="text-muted">({unit})</span>
          </>
        ) : (
          label
        )
      }
      hint={hint}
      error={error}
    >
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cx(inputClass, unit && 'pr-12', rest.type === 'number' && 'num', className)}
          {...rest}
        />
        {unit ? (
          <span
            aria-hidden="true"
            className="num pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted"
          >
            {unit}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
};

export function TextArea({ label, hint, error, className, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(inputClass, 'min-h-28 py-2 leading-relaxed', className)}
        {...rest}
      />
    </FieldShell>
  );
}
