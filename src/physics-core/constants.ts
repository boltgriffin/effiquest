/** Gravitational field strength used everywhere (m/s²). Shown to learners in the model assumptions. */
export const G = 9.81;

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

/** Rounds a reading to an instrument's resolution, like a real scale or ruler. */
export function quantize(value: number, resolution: number): number {
  const q = Math.round(value / resolution) * resolution;
  // Avoid -0 and floating noise such as 66.00000000001.
  return Number((q === 0 ? 0 : q).toFixed(10));
}

export type Validation = { ok: true } | { ok: false; errors: string[] };

export function validation(errors: string[]): Validation {
  return errors.length ? { ok: false, errors } : { ok: true };
}

export const isPositive = (x: number): boolean => Number.isFinite(x) && x > 0;
export const isNonNegative = (x: number): boolean => Number.isFinite(x) && x >= 0;
