import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Icon } from '@/components/icons/Icon';
import { eyebrowClass } from '@/components/ui/styles';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLearnerStore } from '@/store/learnerStore';
import { cx } from '@/utils/cx';
import { BrandMark, BrandName } from './BrandMark';
import { MobileMenu } from './MobileMenu';
import { learnerNav, phoneTabs, teacherNav, utilityNav, type NavItem } from './navigation';

function ConnectionStatus({ compact }: { compact?: boolean }) {
  const online = useOnlineStatus();
  return (
    <p role="status" className="flex items-center gap-2 text-xs text-muted">
      <span
        aria-hidden="true"
        className={cx('size-2 rounded-full', online ? 'bg-success' : 'bg-warning')}
      />
      {compact ? (
        <span className="sr-only">{online ? 'Online' : 'Offline'}</span>
      ) : online ? (
        'Online'
      ) : (
        'Offline, still working'
      )}
    </p>
  );
}

function RailLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cx(
          'relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[0.7rem] font-medium transition-colors duration-150 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm',
          isActive
            ? 'bg-brand-soft text-ink before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-brand'
            : 'text-muted hover:bg-surface-2 hover:text-ink',
        )
      }
    >
      <Icon name={item.icon} size={20} />
      <span className="text-center lg:text-left">{item.label}</span>
    </NavLink>
  );
}

/**
 * Responsive shell:
 *  - phone (<768px): top bar with menu + bottom tab bar (5 tabs)
 *  - tablet (768-1023px): narrow icon rail with short labels
 *  - desktop (>=1024px): full sidebar
 */
export default function AppShell() {
  const online = useOnlineStatus();
  const teacherMode = useLearnerStore((s) => s.teacherMode);
  const learnerCode = useLearnerStore((s) => s.learnerCode);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      {/* Sidebar / rail */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-rule bg-bg md:flex md:w-22 lg:w-60">
        <Link
          to="/"
          className="flex h-16 shrink-0 items-center justify-center border-b border-rule px-3 lg:justify-start lg:px-5"
        >
          {/* The visible brand is the link's name; screen readers also hear "dashboard". */}
          <span className="hidden lg:block">
            <BrandName />
          </span>
          <span className="lg:hidden">
            <BrandMark size={32} />
            <span className="sr-only">EffiQuest</span>
          </span>
          <span className="sr-only"> dashboard</span>
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 lg:p-3">
          {learnerNav.map((item) => (
            <RailLink key={item.to} item={item} />
          ))}
          {teacherMode ? (
            <>
              <p className={cx(eyebrowClass, 'mt-4 hidden px-3 lg:block')}>Teacher</p>
              <span aria-hidden="true" className="mx-3 mt-3 border-t border-rule lg:hidden" />
              {teacherNav.map((item) => (
                <RailLink key={item.to} item={item} />
              ))}
            </>
          ) : null}
        </nav>
        <div className="flex flex-col items-center gap-3 border-t border-rule p-3 lg:items-stretch">
          {utilityNav.map((item) => (
            <RailLink key={item.to} item={item} />
          ))}
          <div className="flex flex-col gap-1 lg:px-3">
            <p className="hidden text-xs text-muted lg:block">
              {learnerCode ? (
                <>
                  Learner <span className="num text-ink">{learnerCode}</span>
                </>
              ) : (
                'No learner code'
              )}
            </p>
            <span className="hidden lg:block">
              <ConnectionStatus />
            </span>
            <span className="lg:hidden">
              <ConnectionStatus compact />
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-bg/95 px-4 backdrop-blur-sm md:hidden">
          <Link to="/" aria-label="EffiQuest dashboard">
            <BrandName compact />
          </Link>
          <div className="flex items-center gap-1">
            {!online ? (
              <Icon name="offline" size={20} className="text-warning" label="Offline" />
            ) : null}
            <button
              type="button"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex size-11 items-center justify-center rounded-md text-ink hover:bg-surface-2"
            >
              <Icon name="menu" size={22} />
            </button>
          </div>
        </header>
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

        {!online ? (
          <p
            role="status"
            className="hidden border-b border-rule bg-surface px-6 py-2 text-sm text-muted md:block"
          >
            You are offline. Saved lessons and the lab keep working; nothing is lost.
          </p>
        ) : null}

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-10 lg:px-10 lg:pt-8"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Phone bottom tabs */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-rule bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {phoneTabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium',
                  isActive ? 'text-brand' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cx(
                      'flex h-7 w-12 items-center justify-center rounded-full',
                      isActive && 'bg-brand-soft',
                    )}
                  >
                    <Icon name={item.icon} size={20} />
                  </span>
                  {item.short ?? item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
