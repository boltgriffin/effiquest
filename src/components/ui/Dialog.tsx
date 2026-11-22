import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal built on the native <dialog>: the browser provides focus containment, Esc to close,
 * inert background and focus return, which is more robust than a hand-rolled trap.
 */
export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the content box) closes it.
        if (e.target === e.currentTarget) onClose();
      }}
      className="eq-dialog m-auto w-[min(36rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-lg border border-rule bg-surface p-0 text-ink shadow-dialog"
    >
      <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3">
        <h2 id={titleId} className="font-display text-xl">
          {title}
        </h2>
        <IconButton icon="close" label="Close" onClick={onClose} />
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-rule px-5 py-3">{footer}</div>
      ) : null}
    </dialog>
  );
}
