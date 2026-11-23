import { useUiStore, type QualityTier } from '@/store/uiStore';

/**
 * What the 3D quality setting (Settings → 3D quality, decision D-08) turns on. "Low" keeps weak
 * phones smooth: no shadows, no reflections, no rope simulation, fewer polygons.
 */
export interface Realism {
  tier: QualityTier;
  shadows: boolean;
  shadowMapSize: number;
  /** Studio reflections on metal and paint. */
  environment: boolean;
  /** Ropes sag and swing; hanging loads sway (visual only). */
  motionEffects: boolean;
  /** Generated surface textures (wood grain, burlap...). */
  textures: boolean;
  /** Round-shape segments. */
  segments: number;
}

const TIERS: Record<QualityTier, Realism> = {
  low: {
    tier: 'low',
    shadows: false,
    shadowMapSize: 512,
    environment: false,
    motionEffects: false,
    textures: false,
    segments: 16,
  },
  auto: {
    tier: 'auto',
    shadows: true,
    shadowMapSize: 1024,
    environment: true,
    motionEffects: true,
    textures: true,
    segments: 32,
  },
  high: {
    tier: 'high',
    shadows: true,
    shadowMapSize: 2048,
    environment: true,
    motionEffects: true,
    textures: true,
    segments: 48,
  },
};

export function realismFor(tier: QualityTier): Realism {
  return TIERS[tier];
}

export function useRealism(): Realism {
  return realismFor(useUiStore((s) => s.quality));
}
