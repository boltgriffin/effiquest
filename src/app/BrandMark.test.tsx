import { renderHook } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import favicon from '../../public/favicon.svg?raw';
import { BrandMark } from './BrandMark';
import { brandMarkSvg } from './brandMarkSvg';
import { useThemedFavicon } from './useThemedFavicon';

// Light and dark values of --brand / --brand-ink in src/styles/index.css
// (Vitest does not load CSS files, so they are repeated here).
const LIGHT = { brand: '#0b6e66', ink: '#ffffff' };
const DARK = { brand: '#4fd1c0', ink: '#04201d' };

const attrs = (svg: string, re: RegExp) => [...svg.matchAll(re)].map((m) => m[1]);
const GEOMETRY = [/viewBox="([^"]+)"/g, /\sd="([^"]+)"/g, /\s((?:cx|cy|r|rx)="[^"]+")/g];

describe('the favicon is the BrandMark logo', () => {
  it('the in-app logo draws the shared mark', () => {
    const logo = renderToStaticMarkup(<BrandMark />);
    const shared = brandMarkSvg(LIGHT.brand, LIGHT.ink);
    for (const re of GEOMETRY) {
      expect(attrs(shared, re).length).toBeGreaterThan(0);
      expect(attrs(logo, re)).toEqual(attrs(shared, re));
    }
  });

  it('public/favicon.svg is the shared mark in light colours, with the dark colours for a dark system theme', () => {
    const withoutExtras = favicon
      .replace(/<!--[\s\S]*?-->\s*/, '')
      .replace(/<style>[\s\S]*?<\/style>/, '')
      .trim();
    expect(withoutExtras).toBe(brandMarkSvg(LIGHT.brand, LIGHT.ink));
    const darkStyle = /<style>([\s\S]*?)<\/style>/.exec(favicon)?.[1] ?? '';
    expect(darkStyle).toContain('prefers-color-scheme: dark');
    expect(darkStyle).toContain(`rect{fill:${DARK.brand}}`);
    expect(darkStyle).toContain(`g{stroke:${DARK.ink}}`);
    expect(darkStyle).toContain(`circle{fill:${DARK.ink}}`);
  });
});

describe('useThemedFavicon', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('style');
  });

  it('redraws the tab icon in the active theme colours', () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.svg" />';
    const root = document.documentElement;
    root.style.setProperty('--brand', DARK.brand);
    root.style.setProperty('--brand-ink', DARK.ink);

    const { rerender } = renderHook(({ theme }) => useThemedFavicon(theme), {
      initialProps: { theme: 'dark' },
    });
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(decodeURIComponent(link?.href ?? '')).toContain(brandMarkSvg(DARK.brand, DARK.ink));

    root.style.setProperty('--brand', LIGHT.brand);
    root.style.setProperty('--brand-ink', LIGHT.ink);
    rerender({ theme: 'light' });
    expect(decodeURIComponent(link?.href ?? '')).toContain(brandMarkSvg(LIGHT.brand, LIGHT.ink));
  });

  it('keeps the static favicon when the tokens are missing', () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.svg" />';
    renderHook(() => useThemedFavicon('system'));
    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg');
  });
});
