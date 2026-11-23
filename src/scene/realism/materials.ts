import { useMemo } from 'react';
import { DoubleSide, MeshStandardMaterial, type Texture } from 'three';
import { useUiStore } from '@/store/uiStore';
import { realismFor, type Realism } from './quality';
import {
  burlapTexture,
  concreteTexture,
  paperTexture,
  ropeTexture,
  steelTexture,
  woodTexture,
} from './textures';

/**
 * Shared physically based materials. Colours of the physics roles stay fixed (CLAUDE.md): parts
 * the learner pushes or pulls are painted in the input (effort) colour; loads keep their real
 * look with an output-colour tag where a label is needed.
 */
export interface LabMaterials {
  steel: MeshStandardMaterial;
  darkSteel: MeshStandardMaterial;
  effortPaint: MeshStandardMaterial;
  loadPaint: MeshStandardMaterial;
  framePaint: MeshStandardMaterial;
  wood: MeshStandardMaterial;
  concrete: MeshStandardMaterial;
  burlap: MeshStandardMaterial;
  paper: MeshStandardMaterial;
  rope: MeshStandardMaterial;
  rubber: MeshStandardMaterial;
  glove: MeshStandardMaterial;
  water: MeshStandardMaterial;
  oil: MeshStandardMaterial;
  glass: MeshStandardMaterial;
  floor: MeshStandardMaterial;
}

function tex(r: Realism, make: () => Texture, repeat = 1): Texture | null {
  if (!r.textures) return null;
  const t = make().clone();
  t.needsUpdate = true;
  t.repeat.set(repeat, repeat);
  return t;
}

const cache = new Map<string, LabMaterials>();

function build(r: Realism, c: { input: string; output: string; frame: string }): LabMaterials {
  const env = r.environment ? 1 : 0;
  return {
    steel: new MeshStandardMaterial({
      color: '#b9bec2',
      metalness: env ? 0.85 : 0.3,
      roughness: 0.35,
      map: tex(r, steelTexture),
    }),
    darkSteel: new MeshStandardMaterial({
      color: '#4a4f54',
      metalness: env ? 0.8 : 0.3,
      roughness: 0.45,
    }),
    effortPaint: new MeshStandardMaterial({ color: c.input, metalness: 0.1, roughness: 0.45 }),
    loadPaint: new MeshStandardMaterial({ color: c.output, metalness: 0.05, roughness: 0.6 }),
    framePaint: new MeshStandardMaterial({ color: c.frame, metalness: 0.2, roughness: 0.6 }),
    wood: new MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.75,
      map: tex(r, woodTexture) ?? undefined,
      ...(r.textures ? {} : { color: '#c99a63' }),
    }),
    concrete: new MeshStandardMaterial({
      color: r.textures ? '#ffffff' : '#b8b4ac',
      roughness: 0.95,
      map: tex(r, concreteTexture),
    }),
    burlap: new MeshStandardMaterial({
      color: r.textures ? '#ffffff' : '#d8c79f',
      roughness: 1,
      map: tex(r, burlapTexture),
    }),
    paper: new MeshStandardMaterial({
      color: r.textures ? '#ffffff' : '#a9a294',
      roughness: 0.9,
      map: tex(r, paperTexture),
    }),
    rope: new MeshStandardMaterial({
      color: r.textures ? '#ffffff' : '#c8b089',
      roughness: 0.95,
      map: tex(r, ropeTexture),
    }),
    rubber: new MeshStandardMaterial({ color: '#2b2d2f', roughness: 0.9 }),
    glove: new MeshStandardMaterial({ color: c.input, roughness: 0.85 }),
    water: new MeshStandardMaterial({
      color: '#3d7fa6',
      metalness: 0.1,
      roughness: 0.15,
      transparent: true,
      opacity: 0.8,
    }),
    oil: new MeshStandardMaterial({
      color: '#c08a2b',
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75,
    }),
    glass: new MeshStandardMaterial({
      color: '#dfe9ee',
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.25,
      side: DoubleSide,
      depthWrite: false,
    }),
    floor: new MeshStandardMaterial({
      color: r.textures ? '#ffffff' : '#bdb9b1',
      roughness: 0.95,
      map: tex(r, concreteTexture, 6),
    }),
  };
}

/** Materials for the current quality tier and theme (cached; shared by every scene). */
export function useLabMaterials(): LabMaterials {
  const quality = useUiStore((s) => s.quality);
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const read = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    const colors = {
      input: read('--input', '#2453b8'),
      output: read('--output', '#96460a'),
      frame: read('--brand', '#0b6e66'),
    };
    const key = `${quality}|${colors.input}|${colors.output}|${colors.frame}`;
    let m = cache.get(key);
    if (!m) {
      m = build(realismFor(quality), colors);
      cache.set(key, m);
    }
    return m;
    // theme changes the token values read above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, theme]);
}
