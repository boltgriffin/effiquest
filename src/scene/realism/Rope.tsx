import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CylinderGeometry, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { useLabMaterials } from './materials';
import { useRealism } from './quality';

const UP = new Vector3(0, 1, 0);
const GRAVITY = -9.81;

/**
 * A rope between two points that sags under gravity and swings when its ends move (verlet
 * simulation, visual only: the effort and efficiency always come from the tested physics model).
 * `ends` is read every frame, so the rope follows moving parts. `slack` > 0 adds length so the
 * rope hangs in a curve. On "Low" quality the rope is a straight line with no simulation.
 */
export function Rope({
  ends,
  slack = 0,
  radius = 0.006,
  segments = 14,
}: {
  ends: () => [Vector3, Vector3];
  /** Extra length as a fraction of the span; a function is read every frame. */
  slack?: number | (() => number);
  radius?: number;
  segments?: number;
}) {
  const r = useRealism();
  const m = useLabMaterials();
  const invalidate = useThree((s) => s.invalidate);
  const mesh = useRef<InstancedMesh>(null);
  const n = r.motionEffects ? segments : 1;
  const geometry = useMemo(() => {
    const g = new CylinderGeometry(radius, radius, 1, Math.max(6, r.segments / 4), 1, true);
    return g;
  }, [radius, r.segments]);

  const pts = useRef<Vector3[]>([]);
  /** Frames since the ends last moved: the rope stops asking for frames once it is still. */
  const quiet = useRef(0);
  const lastEnds = useRef<[Vector3, Vector3]>([new Vector3(), new Vector3()]);
  const prev = useRef<Vector3[]>([]);
  const tmp = useMemo(
    () => ({
      m: new Matrix4(),
      q: new Quaternion(),
      d: new Vector3(),
      mid: new Vector3(),
      s: new Vector3(),
    }),
    [],
  );

  useLayoutEffect(() => {
    const [a, b] = ends();
    pts.current = Array.from({ length: n + 1 }, (_, i) => a.clone().lerp(b, i / n));
    prev.current = pts.current.map((p) => p.clone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useFrame((_, delta) => {
    const [a, b] = ends();
    const [la, lb] = lastEnds.current;
    if (la.distanceToSquared(a) + lb.distanceToSquared(b) > 1e-10) quiet.current = 0;
    else quiet.current++;
    la.copy(a);
    lb.copy(b);
    const p = pts.current;
    const q = prev.current;
    if (p.length !== n + 1) return;
    let moving = false;
    if (n > 1) {
      const span = a.distanceTo(b);
      const sl = typeof slack === 'function' ? slack() : slack;
      const rest = (span * (1 + sl)) / n;
      const dt = Math.min(delta, 1 / 30);
      for (let i = 1; i < n; i++) {
        const cur = p[i]!;
        const old = q[i]!;
        const vx = (cur.x - old.x) * 0.98;
        const vy = (cur.y - old.y) * 0.98;
        const vz = (cur.z - old.z) * 0.98;
        old.copy(cur);
        cur.set(cur.x + vx, cur.y + vy + GRAVITY * dt * dt, cur.z + vz);
        if (Math.abs(vx) + Math.abs(vy) + Math.abs(vz) > 2e-4) moving = true;
      }
      p[0]!.copy(a);
      p[n]!.copy(b);
      for (let k = 0; k < 12; k++) {
        for (let i = 0; i < n; i++) {
          const p1 = p[i]!;
          const p2 = p[i + 1]!;
          tmp.d.subVectors(p2, p1);
          const len = tmp.d.length() || 1e-9;
          const diff = (len - rest) / len;
          if (diff <= 0 && sl > 0) continue; // a rope can go slack but never stretch
          const pinA = i === 0;
          const pinB = i + 1 === n;
          if (pinA && pinB) continue;
          const wA = pinA ? 0 : pinB ? 1 : 0.5;
          const wB = pinB ? 0 : pinA ? 1 : 0.5;
          p1.addScaledVector(tmp.d, diff * wA);
          p2.addScaledVector(tmp.d, -diff * wB);
        }
      }
    } else {
      p[0]!.copy(a);
      p[1]!.copy(b);
    }
    const im = mesh.current;
    if (!im) return;
    for (let i = 0; i < n; i++) {
      const p1 = p[i]!;
      const p2 = p[i + 1]!;
      tmp.d.subVectors(p2, p1);
      const len = tmp.d.length();
      tmp.mid.addVectors(p1, p2).multiplyScalar(0.5);
      tmp.q.setFromUnitVectors(UP, tmp.d.normalize());
      tmp.s.set(1, Math.max(len, 1e-4), 1);
      tmp.m.compose(tmp.mid, tmp.q, tmp.s);
      im.setMatrixAt(i, tmp.m);
    }
    im.instanceMatrix.needsUpdate = true;
    // Keep animating while the rope still swings, but never longer than ~3 s after the ends stop
    // (saves battery on phones: the canvas renders only on demand).
    if (moving && quiet.current < 180) invalidate();
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, m.rope, n]}
      castShadow={r.shadows}
      frustumCulled={false}
    />
  );
}
