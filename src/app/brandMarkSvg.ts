/**
 * The EffiQuest mark (a lever on a fulcrum with a load) as one drawing, shared by the in-app
 * logo (BrandMark.tsx), the live tab icon (useThemedFavicon.ts) and public/favicon.svg
 * (checked by BrandMark.test.tsx).
 */
export const MARK = {
  viewBox: '0 0 32 32',
  size: 32,
  radius: 6,
  strokeWidth: 2.25,
  beam: 'M6 19.5 26 15.5',
  fulcrum: 'm16 17.5-3.5 7h7z',
  load: { cx: 23.5, cy: 12.6, r: 2.4 },
} as const;

/** Standalone SVG markup of the mark in the given background and ink colours. */
export function brandMarkSvg(background: string, ink: string): string {
  const { viewBox, size, radius, strokeWidth, beam, fulcrum, load } = MARK;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
    `<rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>` +
    `<g stroke="${ink}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
    `<path d="${beam}"/><path d="${fulcrum}"/></g>` +
    `<circle cx="${load.cx}" cy="${load.cy}" r="${load.r}" fill="${ink}"/></svg>`
  );
}
