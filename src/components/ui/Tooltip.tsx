import { useEffect, useId, useState, type ReactNode } from 'react';

interface TriggerProps {
  'aria-describedby': string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

interface TooltipProps {
  content: ReactNode;
  /** Render the trigger, spreading the provided props onto a focusable element. */
  children: (props: TriggerProps) => ReactNode;
}

/**
 * Supplementary hint on hover AND keyboard focus; Esc dismisses (WCAG 1.4.13).
 * Never put essential information only in a tooltip.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span className="relative inline-flex">
      {children({
        'aria-describedby': id,
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      })}
      <span
        id={id}
        role="tooltip"
        hidden={!open}
        className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-64 -translate-x-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs leading-snug text-bg shadow-pop"
      >
        {content}
      </span>
    </span>
  );
}
