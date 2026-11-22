/**
 * SI units and conversions. Every calculation works in SI internally; convert at the edge.
 *  length m, mass kg, time s, force N, energy J, power W, area m², pressure Pa, angle in degrees
 *  for inputs (converted to radians for trigonometry).
 */

export const G_STANDARD = 9.81; // m/s², the value used throughout EffiQuest

const factors = {
  length: { mm: 1e-3, cm: 1e-2, m: 1, km: 1e3 },
  mass: { g: 1e-3, kg: 1 },
  time: { ms: 1e-3, s: 1, min: 60, h: 3600 },
  force: { N: 1, kN: 1e3 },
  energy: { J: 1, kJ: 1e3 },
  power: { W: 1, kW: 1e3 },
  area: { 'mm²': 1e-6, 'cm²': 1e-4, 'm²': 1 },
  pressure: { Pa: 1, kPa: 1e3, MPa: 1e6 },
} as const;

export type Dimension = keyof typeof factors;
export type UnitOf<D extends Dimension> = keyof (typeof factors)[D] & string;

/** Converts a value in `unit` to the SI base unit of its dimension. */
export function toSI<D extends Dimension>(dimension: D, value: number, unit: UnitOf<D>): number {
  return value * (factors[dimension] as Record<string, number>)[unit]!;
}

/** Converts an SI value to `unit`. */
export function fromSI<D extends Dimension>(dimension: D, value: number, unit: UnitOf<D>): number {
  return value / (factors[dimension] as Record<string, number>)[unit]!;
}

export function convert<D extends Dimension>(
  dimension: D,
  value: number,
  from: UnitOf<D>,
  to: UnitOf<D>,
): number {
  return fromSI(dimension, toSI(dimension, value, from), to);
}

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Weight from mass: W = m g. Mass (kg) and weight (N) are different quantities. */
export const weightN = (massKg: number, g: number = G_STANDARD): number => massKg * g;

/** Area of a circular piston from its diameter (m → m²). */
export const circleAreaM2 = (diameterM: number): number => (Math.PI * diameterM * diameterM) / 4;

/**
 * cos/sin of an angle in degrees, snapping the exact textbook angles so cos 90° is 0, not 6e-17.
 */
export function cosDeg(deg: number): number {
  const r = ((deg % 360) + 360) % 360;
  if (r === 90 || r === 270) return 0;
  if (r === 0) return 1;
  if (r === 180) return -1;
  if (r === 60 || r === 300) return 0.5;
  if (r === 120 || r === 240) return -0.5;
  return Math.cos(degToRad(deg));
}

export function sinDeg(deg: number): number {
  const r = ((deg % 360) + 360) % 360;
  if (r === 0 || r === 180) return 0;
  if (r === 90) return 1;
  if (r === 270) return -1;
  if (r === 30 || r === 150) return 0.5;
  if (r === 210 || r === 330) return -0.5;
  return Math.sin(degToRad(deg));
}
