/**
 * Realistic loads, sized from their real mass (true proportions):
 * - crate: wooden crate with contents, about 400 kg/m³
 * - sack: rice sack (burlap), about 750 kg/m³ (a 50 kg sack is roughly 0.80 × 0.50 × 0.17 m)
 * - cement: cement bag (kraft paper), about 1300 kg/m³ (40 kg ≈ 0.60 × 0.40 × 0.13 m)
 * - bucket: steel bucket of water, 1000 kg/m³ (10 kg ≈ 10 L)
 * - block: concrete block, 2300 kg/m³
 * - steel: steel billet, 7850 kg/m³ (dense loads such as a jack's: 500 kg ≈ a 0.40 m cube)
 * Every load's origin is the middle of its base, so scenes place it by where it rests or hangs.
 */
export type LoadKind = 'crate' | 'sack' | 'cement' | 'bucket' | 'block' | 'steel';

export interface LoadSize {
  w: number;
  h: number;
  d: number;
}

const cbrt = Math.cbrt;

export function loadSize(kind: LoadKind, massKg: number): LoadSize {
  const m = Math.max(massKg, 0.5);
  switch (kind) {
    case 'crate': {
      const s = cbrt(m / 400);
      return { w: s, h: s, d: s };
    }
    case 'sack': {
      // keep the 0.80 : 0.50 : 0.17 shape of a 50 kg sack
      const k = cbrt(m / 750 / (0.8 * 0.5 * 0.17));
      return { w: 0.5 * k, h: 0.8 * k, d: 0.17 * k };
    }
    case 'cement': {
      const k = cbrt(m / 1300 / (0.6 * 0.4 * 0.13));
      return { w: 0.6 * k, h: 0.13 * k, d: 0.4 * k };
    }
    case 'bucket': {
      // water volume plus a little headroom; height ≈ 1.1 × diameter
      const v = m / 1000;
      const radius = cbrt(v / (Math.PI * 2.2)) * 1.08;
      return { w: radius * 2, h: radius * 2.2 * 1.15, d: radius * 2 };
    }
    case 'block': {
      const s = cbrt(m / 2300);
      return { w: s * 1.2, h: s * 0.8, d: s * 1.04 };
    }
    case 'steel': {
      const s = cbrt(m / 7850);
      return { w: s * 1.25, h: s * 0.8, d: s };
    }
  }
}
