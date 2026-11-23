import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { useUiStore } from '@/store/uiStore';
import { SceneLabel } from './SceneLabel';

interface LeverSceneProps {
  effortArmM: number;
  loadArmM: number;
  rotationDeg: number;
  motion: MotionRef;
  playing: boolean;
}

const PIVOT_Y = 0.55;

function useColors() {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const read = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    return {
      ink: read('--ink', '#1b1f1e'),
      brand: read('--brand', '#0b6e66'),
      input: read('--input', '#2453b8'),
      output: read('--output', '#96460a'),
      surface: read('--surface-2', '#ece9e0'),
      grid: read('--rule-strong', '#857e70'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

/** First-class lever in metres; the beam group turns about the fulcrum from the shared motion. */
export function LeverScene({
  effortArmM,
  loadArmM,
  rotationDeg,
  motion,
  playing,
}: LeverSceneProps) {
  const c = useColors();
  const beam = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  // Centre the beam over the origin.
  const offset = (loadArmM - effortArmM) / 2;

  const place = () => {
    const t = (motion.current.fraction * rotationDeg * Math.PI) / 180;
    // Effort end (+x) goes down: negative rotation about z.
    beam.current?.rotation.set(0, 0, -t);
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, effortArmM, loadArmM, invalidate]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.3} />
      <group position={[offset, 0, 0]}>
        {/* Fulcrum */}
        <mesh position={[0, PIVOT_Y / 2, 0]}>
          <coneGeometry args={[0.16, PIVOT_Y, 3]} />
          <meshStandardMaterial color={c.surface} />
        </mesh>
        <SceneLabel position={[0, 0.12, 0.35]}>Fulcrum</SceneLabel>

        <group ref={beam} position={[0, PIVOT_Y, 0]}>
          <mesh position={[(effortArmM - loadArmM) / 2, 0.02, 0]}>
            <boxGeometry args={[effortArmM + loadArmM, 0.04, 0.12]} />
            <meshStandardMaterial color={c.ink} />
          </mesh>
          {/* Load on the load arm */}
          <mesh position={[-loadArmM + 0.09, 0.13, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial color={c.output} roughness={0.7} />
          </mesh>
          <SceneLabel position={[-loadArmM + 0.09, 0.36, 0]}>Load</SceneLabel>
          {/* Effort pushing down at the end of the effort arm */}
          <mesh position={[effortArmM - 0.02, 0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 12]} />
            <meshStandardMaterial color={c.input} />
          </mesh>
          <mesh position={[effortArmM - 0.02, 0.06, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.05, 0.08, 12]} />
            <meshStandardMaterial color={c.input} />
          </mesh>
          <SceneLabel position={[effortArmM - 0.02, 0.45, 0]}>Effort</SceneLabel>
          <SceneLabel position={[-loadArmM / 2, -0.12, 0.2]}>Load arm</SceneLabel>
          <SceneLabel position={[effortArmM / 2, -0.12, 0.2]}>Effort arm</SceneLabel>
        </group>
      </group>
      <gridHelper args={[4, 16, c.grid, c.grid]} />
      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        enablePan={false}
        minDistance={0.8}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
