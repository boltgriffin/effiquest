import type { IconName } from '@/components/icons/Icon';

export interface NavItem {
  to: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short?: string;
  icon: IconName;
  end?: boolean;
}

/** Learner destinations, in journey order. The single source for sidebar, rail, tabs and menu. */
export const learnerNav: NavItem[] = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: 'home', end: true },
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/lab', label: 'Lab', icon: 'lab' },
  { to: '/quests', label: 'Quests', icon: 'quest' },
  { to: '/assess', label: 'Assess', icon: 'assess' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
];

/** The phone tab bar holds five; the rest are in the menu. */
export const phoneTabs = learnerNav.filter((i) => i.to !== '/assess');

/** Shown only when teacher mode is on for this device. */
export const teacherNav: NavItem[] = [{ to: '/teacher', label: 'Class overview', icon: 'class' }];

export const utilityNav: NavItem[] = [{ to: '/settings', label: 'Settings', icon: 'settings' }];
