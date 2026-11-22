/**
 * Rounding and display. Calculations keep full precision; only display rounds.
 */

/** Rounds half away from zero to `decimals` places, avoiding float artefacts (1.005 → 1.01). */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const sign = Math.sign(value);
  const abs = Math.abs(value);
  // Shift by string exponent so 1.005 is not stored as 1.00499…; very small/large values
  // (already in exponent notation) fall back to plain scaling.
  const rounded = String(abs).includes('e')
    ? Math.round(abs * 10 ** decimals) / 10 ** decimals
    : Number(`${Math.round(Number(`${abs}e${decimals}`))}e-${decimals}`);
  return sign * rounded || 0;
}

/** Up to `sig` significant figures, no trailing zeros, en-US digits: 132.08 → "132.1", 5000 → "5,000". */
export function sig(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return '0';
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.max(0, digits - 1 - magnitude);
  return roundTo(value, decimals).toLocaleString('en-US', { maximumFractionDigits: decimals });
}

/** "74.3 %", "132.1 J", "4" (dimensionless). */
export function withUnit(value: number, unit: string, digits = 4): string {
  const n = sig(value, digits);
  if (!unit) return n;
  return unit === '%' || unit === '°' ? `${n}${unit}` : `${n} ${unit}`;
}

/** Fixed decimals for tables and readouts: 74.27 → "74.3". */
export function fixed(value: number, decimals: number): string {
  return roundTo(value, decimals).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
