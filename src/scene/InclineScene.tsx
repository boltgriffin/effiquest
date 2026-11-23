import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import { ExtrudeGeometry, Shape, type Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { SceneLabel } from './SceneLabel';
import { useUiStore } from '@/store/uiStore';

interface InclineSceneProps {
  angleDeg: number;
  lengthM: number;
  motion: MotionRef;
  playing: boolean;
}

const BLOCK = { length: 0.3, height: 0.18, depth: 0.25 };
const DEPTH = 0.7;

/** Reads a design token so 3D colors follow the light/dark theme. */
function useTokenColors() {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    return {
      ramp: read('--surface-2', '#ece9e0'),
      edge: read('--ink', '#1b1f1e'),
      block: read('--brand', '#0b6e66'),
      input: read('--input', '#2453b8'),
      ground: read('--rule-strong', '#857e70'),
    };
    // Re-read when the user switches theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

/**
 * Inclined plane in metres: the ramp surface is `lengthM` long at `angleDeg`. The block follows
 * the shared run motion; nothing here computes physics.
 */
export function InclineScene({ angleDeg, lengthM, motion, playing }: InclineSceneProps) {
  const colors = useTokenColors();
  const block = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const t = (angleDeg * Math.PI) / 180;
  const base = lengthM * Math.cos(t);
  const height = lengthM * Math.sin(t);

  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(base, 0);
    shape.lineTo(base, height);
    shape.closePath();
    const g = new ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false });
    g.translate(0, 0, -DEPTH / 2);
    return g;
  }, [base, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const place = () => {
    const g = block.current;
    if (!g) return;
    const s = BLOCK.length / 2 + motion.current.fraction * (lengthM - BLOCK.length);
    g.position.set(s * Math.cos(t), s * Math.sin(t), 0);
    g.rotation.set(0, 0, t);
  };

  // Render on demand: keep requesting frames only while a run plays.
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, angleDeg, lengthM, invalidate]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.4} />
      <group position={[-base / 2, 0, 0]}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color={colors.ramp} roughness={0.9} />
        </mesh>
        <SceneLabel position={[base * 0.75, height * 0.2, DEPTH / 2 + 0.05]}>Ramp</SceneLabel>
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color={colors.edge} />
        </lineSegments>
        <group ref={block}>
          <mesh position={[0, BLOCK.height / 2, 0]}>
            <boxGeometry args={[BLOCK.length, BLOCK.height, BLOCK.depth]} />
            <meshStandardMaterial color={colors.block} roughness={0.6} />
          </mesh>
          <SceneLabel position={[0, BLOCK.height + 0.14, 0]}>Block (load)</SceneLabel>
          <SceneLabel position={[BLOCK.length / 2 + 0.55, BLOCK.height / 2, 0]}>Effort</SceneLabel>
          {/* Effort rope, pulled up the slope */}
          <Line
            points={[
              [BLOCK.length / 2, BLOCK.height / 2, 0],
              [BLOCK.length / 2 + 0.45, BLOCK.height / 2, 0],
            ]}
            color={colors.input}
            lineWidth={3}
          />
        </group>
      </group>
      <gridHelper args={[6, 12, colors.ground, colors.ground]} position={[0, -0.001, 0]} />
      <OrbitControls
        makeDefault
        target={[0, height / 2, 0]}
        enablePan={false}
        minDistance={1.5}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
