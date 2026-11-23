import { RoundedBox } from '@react-three/drei';
import { useLabMaterials } from './materials';
import { useRealism } from './quality';

import { loadSize, type LoadKind } from './loadSize';

/** A realistic load, true to size (see loadSize.ts). Origin: the middle of its base. */
export function LoadObject({ kind, massKg }: { kind: LoadKind; massKg: number }) {
  const m = useLabMaterials();
  const r = useRealism();
  const s = loadSize(kind, massKg);
  const seg = r.segments;

  switch (kind) {
    case 'crate': {
      const t = Math.max(0.012, s.w * 0.07); // batten thickness
      const edges: Array<[number, number, number, number, number, number]> = [];
      for (const y of [t / 2, s.h - t / 2]) {
        edges.push([0, y, s.d / 2 - t / 2, s.w, t, t], [0, y, -s.d / 2 + t / 2, s.w, t, t]);
        edges.push([s.w / 2 - t / 2, y, 0, t, t, s.d], [-s.w / 2 + t / 2, y, 0, t, t, s.d]);
      }
      for (const x of [-1, 1])
        for (const z of [-1, 1]) {
          edges.push([(x * (s.w - t)) / 2, s.h / 2, (z * (s.d - t)) / 2, t, s.h, t]);
        }
      return (
        <group>
          <mesh position={[0, s.h / 2, 0]} material={m.wood}>
            <boxGeometry args={[s.w * 0.98, s.h * 0.98, s.d * 0.98]} />
          </mesh>
          {edges.map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]} material={m.wood}>
              <boxGeometry args={[w * 1.001, h * 1.001, d * 1.001]} />
            </mesh>
          ))}
        </group>
      );
    }
    case 'sack':
      return (
        <group>
          <RoundedBox
            args={[s.w, s.h, s.d]}
            radius={Math.min(s.d * 0.45, s.w * 0.2)}
            smoothness={3}
            position={[0, s.h / 2, 0]}
            material={m.burlap}
          />
          {/* tied neck at the top */}
          <mesh position={[0, s.h + s.d * 0.12, 0]} material={m.burlap}>
            <cylinderGeometry args={[s.d * 0.12, s.d * 0.3, s.d * 0.3, Math.max(8, seg / 3)]} />
          </mesh>
          <mesh
            position={[0, s.h + s.d * 0.02, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            material={m.rope}
          >
            <torusGeometry args={[s.d * 0.2, s.d * 0.04, 6, Math.max(8, seg / 2)]} />
          </mesh>
        </group>
      );
    case 'cement':
      return (
        <RoundedBox
          args={[s.w, s.h, s.d]}
          radius={s.h * 0.35}
          smoothness={3}
          position={[0, s.h / 2, 0]}
          material={m.paper}
        />
      );
    case 'bucket': {
      const rad = s.w / 2;
      return (
        <group>
          <mesh position={[0, s.h / 2, 0]} material={m.steel}>
            <cylinderGeometry args={[rad, rad * 0.86, s.h, seg, 1, true]} />
          </mesh>
          <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.steel}>
            <circleGeometry args={[rad * 0.86, seg]} />
          </mesh>
          <mesh position={[0, s.h * 0.86, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.water}>
            <circleGeometry args={[rad * 0.97, seg]} />
          </mesh>
          {/* bail handle */}
          <mesh position={[0, s.h, 0]} rotation={[0, 0, 0]} material={m.darkSteel}>
            <torusGeometry args={[rad, 0.004, 6, seg, Math.PI]} />
          </mesh>
        </group>
      );
    }
    case 'steel':
      return (
        <mesh position={[0, s.h / 2, 0]} material={m.darkSteel}>
          <boxGeometry args={[s.w, s.h, s.d]} />
        </mesh>
      );
    case 'block':
      return (
        <mesh position={[0, s.h / 2, 0]} material={m.concrete}>
          <boxGeometry args={[s.w, s.h, s.d]} />
        </mesh>
      );
  }
}
