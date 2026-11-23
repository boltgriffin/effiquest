import { useEffect } from 'react';
import { brandMarkSvg } from './brandMarkSvg';

/**
 * Keeps the browser tab icon identical to the in-app logo in the active theme. The logo takes
 * its colours from the --brand / --brand-ink tokens, which change with light/dark; a static
 * favicon can only follow the system setting, not a theme chosen in Settings.
 * `theme` is the current choice; it re-runs the effect after the theme is applied.
 */
export function useThemedFavicon(theme: string) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const apply = () => {
      const css = getComputedStyle(document.documentElement);
      const background = css.getPropertyValue('--brand').trim();
      const ink = css.getPropertyValue('--brand-ink').trim();
      if (!background || !ink) return; // tokens not loaded: keep the static favicon
      link.href = `data:image/svg+xml,${encodeURIComponent(brandMarkSvg(background, ink))}`;
    };
    apply();
    // With the "system" theme the tokens follow the OS setting, which can change at any time.
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', apply);
    return () => media?.removeEventListener('change', apply);
  }, [theme]);
}
