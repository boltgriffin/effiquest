import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { useUiStore } from '@/store/uiStore';
import { SceneLabel } from './SceneLabel';

interface HydraulicSceneProps {
  inputDiameterM: number;
  outputDiameterM: number;
  motion: MotionRef;
  playing: boolean;
}

/** Visual scale: piston diameters × 5 so they are visible; movements drawn over fixed lengths. */
const SIZE = 5;
const LX = -0.45;
const RX = 0.45;
const CYL_H = 0.9;
const IN_TRAVEL = 0.45;
const OUT_TRAVEL = 0.18;

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

/**
 * Hydraulic press in 3D. Diameters keep their true ratio (both × 5); piston movements are drawn
 * over fixed lengths (not to scale) because the small piston travels many times further.
 */
export function HydraulicScene({
  inputDiameterM,
  outputDiameterM,
  motion,
  playing,
}: HydraulicSceneProps) {
  const c = useColors();
  const invalidate = useThree((s) => s.invalidate);
  const r1 = (inputDiameterM * SIZE) / 2;
  const r2 = (outputDiameterM * SIZE) / 2;
  const inPiston = useRef<Group>(null);
  const outPiston = useRef<Group>(null);
  const inFluid = useRef<Mesh>(null);
  const outFluid = useRef<Mesh>(null);
  const inStart = CYL_H - 0.1;
  const outStart = 0.45;

  const place = () => {
    const f = motion.current.fraction;
    const yIn = inStart - f * IN_TRAVEL;
    const yOut = outStart + f * OUT_TRAVEL;
    inPiston.current?.position.set(LX, yIn, 0);
    outPiston.current?.position.set(RX, yOut, 0);
    const fl = (m: Mesh | null, x: number, top: number) => {
      if (!m) return;
      m.position.set(x, (top + 0.1) / 2, 0);
      m.scale.set(1, top - 0.1, 1);
    };
    fl(inFluid.current, LX, yIn);
    fl(outFluid.current, RX, yOut);
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, inputDiameterM, outputDiameterM, invalidate]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      {/* Base pipe */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[RX - LX + 0.2, 0.1, Math.max(r1, 0.06) * 2]} />
        <meshStandardMaterial color={c.brand} transparent opacity={0.55} />
      </mesh>
      {/* Cylinder walls (see-through) */}
      {[
        [LX, r1],
        [RX, r2],
      ].map(([x, r]) => (
        <mesh key={x} position={[x ?? 0, 0.1 + CYL_H / 2, 0]}>
          <cylinderGeometry args={[(r ?? 0.05) + 0.01, (r ?? 0.05) + 0.01, CYL_H, 32, 1, true]} />
          <meshStandardMaterial color={c.surface} transparent opacity={0.35} />
        </mesh>
      ))}
      {/* Fluid columns (unit height, scaled per frame) */}
      <mesh ref={inFluid}>
        <cylinderGeometry args={[r1, r1, 1, 24]} />
        <meshStandardMaterial color={c.brand} transparent opacity={0.55} />
      </mesh>
      <mesh ref={outFluid}>
        <cylinderGeometry args={[r2, r2, 1, 32]} />
        <meshStandardMaterial color={c.brand} transparent opacity={0.55} />
      </mesh>
      {/* Input piston with rod */}
      <group ref={inPiston}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[r1, r1, 0.04, 24]} />
          <meshStandardMaterial color={c.input} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
          <meshStandardMaterial color={c.input} />
        </mesh>
        <SceneLabel position={[-0.25, 0.45, 0]}>Effort (small piston)</SceneLabel>
      </group>
      {/* Output piston with load */}
      <group ref={outPiston}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[r2, r2, 0.04, 32]} />
          <meshStandardMaterial color={c.brand} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[Math.max(0.26, r2 * 2), 0.26, Math.max(0.26, r2 * 2)]} />
          <meshStandardMaterial color={c.output} roughness={0.7} />
        </mesh>
        <SceneLabel position={[0.35, 0.2, 0]}>Load (large piston)</SceneLabel>
      </group>
      <SceneLabel position={[0, 0.05, 0.25]}>Fluid: same pressure everywhere</SceneLabel>
      <gridHelper args={[4, 16, c.grid, c.grid]} />
      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        enablePan={false}
        minDistance={0.8}
        maxDistance={5}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
