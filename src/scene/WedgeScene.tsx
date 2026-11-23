import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Shape, type Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { useUiStore } from '@/store/uiStore';
import { SceneLabel } from './SceneLabel';

interface WedgeSceneProps {
  wedgeAngleDeg: number;
  pushM: number;
  motion: MotionRef;
  playing: boolean;
}

/** Drawn 2× true size so the wedge reads clearly; the geometry (angle, push, rise) is exact. */
const SCALE = 2;
const LEN = 0.45;
const START = 0.12; // tip already past the load at the start
const DEPTH = 0.3;
const LOAD_W = 0.17;
const LOAD_H = 0.12;

function useColors() {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const read = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    return {
      input: read('--input', '#2453b8'),
      output: read('--output', '#96460a'),
      surface: read('--surface-2', '#ece9e0'),
      guide: read('--rule-strong', '#857e70'),
      grid: read('--rule', '#d9d4c7'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

/** Lifting wedge in 3D: the wedge slides along the floor under a load held by two guides. */
export function WedgeScene({ wedgeAngleDeg, pushM, motion, playing }: WedgeSceneProps) {
  const c = useColors();
  const invalidate = useThree((s) => s.invalidate);
  const wedge = useRef<Group>(null);
  const load = useRef<Group>(null);
  const tan = Math.tan((wedgeAngleDeg * Math.PI) / 180);

  // Wedge cross-section: tip at x = 0, back at x = −LEN, top rising towards the back.
  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.lineTo(-LEN * SCALE, 0);
    s.lineTo(-LEN * SCALE, LEN * tan * SCALE);
    s.closePath();
    return s;
  }, [tan]);

  const place = () => {
    const insert = START + pushM * motion.current.fraction;
    // A flat-bottomed load rests on the slope by its uphill (left) edge.
    const underEdge = (insert + LOAD_W / 2) * tan;
    wedge.current?.position.set(insert * SCALE, 0, -(DEPTH * SCALE) / 2);
    load.current?.position.set(0, underEdge * SCALE, 0);
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, wedgeAngleDeg, invalidate]);

  const lw = LOAD_W * SCALE;
  const lh = LOAD_H * SCALE;
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[3, 0.04, 1.4]} />
        <meshStandardMaterial color={c.surface} roughness={0.9} />
      </mesh>
      <group ref={wedge}>
        <mesh>
          <extrudeGeometry args={[shape, { depth: DEPTH * SCALE, bevelEnabled: false }]} />
          <meshStandardMaterial color={c.input} roughness={0.6} />
        </mesh>
        <SceneLabel position={[-LEN * SCALE, LEN * tan * SCALE + 0.08, (DEPTH * SCALE) / 2]}>
          Wedge (pushed)
        </SceneLabel>
      </group>
      {/* Guides behind the load: they let it move only up and down */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (LOAD_W * SCALE)) / 2, 0.55, -(DEPTH * SCALE) / 2 - 0.03]}>
          <boxGeometry args={[0.04, 1.1, 0.04]} />
          <meshStandardMaterial color={c.guide} />
        </mesh>
      ))}
      <group ref={load}>
        <mesh position={[0, lh / 2, 0]}>
          <boxGeometry args={[lw, lh, DEPTH * SCALE - 0.04]} />
          <meshStandardMaterial color={c.output} roughness={0.7} />
        </mesh>
        <SceneLabel position={[0, lh + 0.08, 0]}>Load (guided)</SceneLabel>
      </group>
      <gridHelper args={[4, 16, c.grid, c.grid]} position={[0, -0.039, 0]} />
      <OrbitControls
        makeDefault
        target={[0, 0.15, 0]}
        enablePan={false}
        minDistance={0.6}
        maxDistance={4}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
