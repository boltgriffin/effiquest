import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt';
import { useUiStore } from '@/store/uiStore';
import { useThemedFavicon } from './useThemedFavicon';

/** Wraps every route: applies the theme choice and hosts app-wide overlays. */
export default function RootLayout() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
  useThemedFavicon(theme);

  return (
    <>
      <Outlet />
      <PwaUpdatePrompt />
    </>
  );
}
