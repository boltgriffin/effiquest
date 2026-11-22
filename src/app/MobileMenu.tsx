import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/Button';
import { eyebrowClass } from '@/components/ui/styles';
import { useLearnerStore } from '@/store/learnerStore';
import { cx } from '@/utils/cx';
import { learnerNav, teacherNav, utilityNav, type NavItem } from './navigation';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

function MenuLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cx(
          'flex min-h-12 items-center gap-3 rounded-md px-3 font-medium',
          isActive ? 'bg-brand-soft text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink',
        )
      }
    >
      <Icon name={item.icon} size={20} />
      {item.label}
    </NavLink>
  );
}

/** Phone menu: a side sheet built on the native <dialog> (focus containment, Esc, backdrop). */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();
  const teacherMode = useLearnerStore((s) => s.teacherMode);
  const learnerCode = useLearnerStore((s) => s.learnerCode);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Navigating closes the menu.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onClose();
    // Only route changes should close it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <dialog
      ref={ref}
      aria-label="Menu"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="eq-dialog m-0 ml-auto h-dvh max-h-dvh w-[min(20rem,85vw)] border-l border-rule bg-bg p-0 text-ink"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-between border-b border-rule px-4">
          <span className="font-display text-lg">Menu</span>
          <IconButton icon="close" label="Close menu" onClick={onClose} />
        </div>
        <nav aria-label="Menu" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {learnerNav.map((i) => (
            <MenuLink key={i.to} item={i} />
          ))}
          {teacherMode ? (
            <>
              <p className={cx(eyebrowClass, 'mt-4 px-3')}>Teacher</p>
              {teacherNav.map((i) => (
                <MenuLink key={i.to} item={i} />
              ))}
            </>
          ) : null}
          <div className="mt-4 border-t border-rule pt-3">
            {utilityNav.map((i) => (
              <MenuLink key={i.to} item={i} />
            ))}
          </div>
        </nav>
        <p className="border-t border-rule px-6 py-3 text-sm text-muted">
          {learnerCode ? (
            <>
              Learner code <span className="num text-ink">{learnerCode}</span>
            </>
          ) : (
            'No learner code on this device'
          )}
        </p>
      </div>
    </dialog>
  );
}
