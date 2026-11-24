import { useEffect, useState } from 'react';
import { BrandName } from '@/app/BrandMark';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { useLearnerStore } from '@/store/learnerStore';
import { cx } from '@/utils/cx';

type NavLinkSpec = { label: string; section: string } | { label: string; to: string };

/** Sections of the welcome page, plus the existing lesson list. */
const LINKS: NavLinkSpec[] = [
  { label: 'Home', section: 'top' },
  { label: 'Simulations', section: 'simulations' },
  { label: 'Learning resources', to: '/learn' },
  { label: 'About', section: 'about' },
];
const SECTIONS = LINKS.flatMap((l) => ('section' in l ? [l.section] : []));

/** Which welcome section is under the header (for the active link). */
function useActiveSection(): string {
  const [active, setActive] = useState('top');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).at(-1);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/**
 * Welcome screen navigation: brand, section links, the lessons, and the way into the app. There
 * are no learner accounts on this screen (D-03, D-20): the button continues with the learner code
 * saved on this device, if any.
 */
export function WelcomeNav({
  onEnter,
  onNavigate,
}: {
  onEnter: () => void;
  onNavigate: (to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const learnerCode = useLearnerStore((s) => s.learnerCode);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const link = (l: NavLinkSpec, mobile: boolean) => {
    const isActive = 'section' in l && l.section === active;
    const className = cx(
      'relative inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors',
      mobile && 'w-full text-base',
      isActive ? 'text-ink' : 'text-muted hover:text-ink',
    );
    const indicator = isActive ? (
      <span
        aria-hidden="true"
        className={cx(
          'absolute rounded-full bg-brand',
          mobile ? 'top-1/2 left-0 h-5 w-0.5 -translate-y-1/2' : 'right-3 bottom-1.5 left-3 h-0.5',
        )}
      />
    ) : null;
    if ('to' in l) {
      return (
        <a
          key={l.label}
          href={l.to}
          className={className}
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            onNavigate(l.to);
          }}
        >
          {l.label}
        </a>
      );
    }
    return (
      <a
        key={l.label}
        href={`#${l.section}`}
        aria-current={isActive ? 'location' : undefined}
        className={className}
        onClick={() => setOpen(false)}
      >
        {l.label}
        {indicator}
      </a>
    );
  };

  const enterLabel = learnerCode ? `Continue as ${learnerCode}` : 'Enter the lab';

  return (
    <header className="sticky top-0 z-30 border-b border-rule/70 bg-bg/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="shrink-0 rounded-md">
          <BrandName />
        </a>
        <nav aria-label="Welcome" className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => link(l, false))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={learnerCode ? 'user' : undefined}
            iconRight="arrowRight"
            onClick={onEnter}
            className="min-h-11"
          >
            <span className="sm:hidden">Enter</span>
            <span className="hidden sm:inline">{enterLabel}</span>
          </Button>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="welcome-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
            className="grid size-11 place-items-center rounded-md text-ink hover:bg-surface-2 md:hidden"
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
      <div
        id="welcome-menu"
        hidden={!open}
        className="border-t border-rule bg-bg/95 px-4 pt-2 pb-4 backdrop-blur-md md:hidden"
      >
        <nav aria-label="Welcome (menu)" className="flex flex-col">
          {LINKS.map((l) => link(l, true))}
        </nav>
      </div>
    </header>
  );
}
