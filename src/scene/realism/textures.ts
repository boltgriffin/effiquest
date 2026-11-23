import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

/**
 * Surface textures generated in code (no image downloads: the app works offline, D-08).
 * Each is drawn once on a small canvas and cached. Deterministic (seeded) so screenshots and
 * tests are stable.
 */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const cache = new Map<string, Texture>();

function make(
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, n: number) => void,
  color = true,
): Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, size);
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  if (color) t.colorSpace = SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** Light pine planks with grain lines. */
export function woodTexture(): Texture {
  return make('wood', 256, (c, n) => {
    const r = rng(7);
    c.fillStyle = '#c99a63';
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 90; i++) {
      const y = r() * n;
      c.strokeStyle = `rgba(110, 70, 35, ${0.08 + r() * 0.18})`;
      c.lineWidth = 0.6 + r() * 1.6;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= n; x += 16) c.lineTo(x, y + Math.sin(x / 40 + i) * 2.5 + (r() - 0.5));
      c.stroke();
    }
    // Plank joints
    c.fillStyle = 'rgba(70, 40, 20, 0.55)';
    for (let y = 0; y < n; y += n / 4) c.fillRect(0, y, n, 2);
  });
}

/** Brushed steel: fine horizontal streaks. */
export function steelTexture(): Texture {
  return make('steel', 256, (c, n) => {
    const r = rng(11);
    c.fillStyle = '#9ea4a8';
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 400; i++) {
      const g = 130 + Math.floor(r() * 70);
      c.fillStyle = `rgba(${g}, ${g + 4}, ${g + 8}, 0.35)`;
      c.fillRect(0, r() * n, n, 0.5 + r());
    }
  });
}

/** Smooth concrete floor with soft blotches and specks. */
export function concreteTexture(): Texture {
  return make('concrete', 256, (c, n) => {
    const r = rng(3);
    c.fillStyle = '#b8b4ac';
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 60; i++) {
      const x = r() * n;
      const y = r() * n;
      const g = c.createRadialGradient(x, y, 0, x, y, 10 + r() * 40);
      const v = r() > 0.5 ? 255 : 0;
      g.addColorStop(0, `rgba(${v},${v},${v},0.06)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, n, n);
    }
    for (let i = 0; i < 1500; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(80,80,80,0.25)' : 'rgba(240,240,240,0.25)';
      c.fillRect(r() * n, r() * n, 1, 1);
    }
  });
}

/** Woven burlap (sacks): a cross-hatch weave with a printed band. */
export function burlapTexture(): Texture {
  return make('burlap', 256, (c, n) => {
    const r = rng(5);
    c.fillStyle = '#d8c79f';
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < n; i += 4) {
      c.fillStyle = `rgba(120, 95, 55, ${0.18 + r() * 0.12})`;
      c.fillRect(i, 0, 1.5, n);
      c.fillStyle = `rgba(120, 95, 55, ${0.14 + r() * 0.12})`;
      c.fillRect(0, i, n, 1.5);
    }
    c.fillStyle = 'rgba(30, 90, 60, 0.55)';
    c.fillRect(0, n * 0.42, n, n * 0.16);
  });
}

/** Grey kraft paper (cement bags). */
export function paperTexture(): Texture {
  return make('paper', 256, (c, n) => {
    const r = rng(9);
    c.fillStyle = '#a9a294';
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 2000; i++) {
      c.fillStyle = `rgba(60, 55, 45, ${r() * 0.15})`;
      c.fillRect(r() * n, r() * n, 1 + r() * 2, 1);
    }
    c.fillStyle = 'rgba(160, 40, 30, 0.7)';
    c.fillRect(0, n * 0.35, n, n * 0.08);
  });
}

/** Twisted rope: diagonal strands. Repeat along the rope's length. */
export function ropeTexture(): Texture {
  return make('rope', 64, (c, n) => {
    c.fillStyle = '#c8b089';
    c.fillRect(0, 0, n, n);
    c.strokeStyle = 'rgba(90, 65, 35, 0.6)';
    c.lineWidth = 3;
    for (let i = -n; i < 2 * n; i += 10) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i + n, n);
      c.stroke();
    }
  });
}
