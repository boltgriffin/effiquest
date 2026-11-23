import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Curve, Vector3, type Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { useUiStore } from '@/store/uiStore';
import { SceneLabel } from './SceneLabel';

interface ScrewSceneProps {
  handleRadiusM: number;
  pitchMm: number;
  liftM: number;
  motion: MotionRef;
  playing: boolean;
}

/** Visual scale: the screw is drawn 5× wider and its rise 5× taller than true; the handle is to scale. */
const RISE_SCALE = 5;
const SCREW_R = 0.06;
const SCREW_H = 0.5;
const BASE_TOP = 0.25;

class Helix extends Curve<Vector3> {
  constructor(
    private readonly radius: number,
    private readonly height: number,
    private readonly turns: number,
  ) {
    super();
  }
  override getPoint(t: number, target = new Vector3()): Vector3 {
    const a = 2 * Math.PI * this.turns * t;
    return target.set(this.radius * Math.cos(a), this.height * t, this.radius * Math.sin(a));
  }
}

function useColors() {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const read = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    return {
      ink: read('--ink', '#1b1f1e'),
      input: read('--input', '#2453b8'),
      output: read('--output', '#96460a'),
      metal: read('--rule-strong', '#857e70'),
      surface: read('--surface-2', '#ece9e0'),
      grid: read('--rule', '#d9d4c7'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

/** Screw jack in 3D: the handle turns the threaded screw, which rises with the load. */
export function ScrewScene({ handleRadiusM, pitchMm, liftM, motion, playing }: ScrewSceneProps) {
  const c = useColors();
  const invalidate = useThree((s) => s.invalidate);
  const lift = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const turns = liftM / (pitchMm / 1000);
  // Thread drawn with the same number of turns per drawn height as the true pitch would give
  // (capped so it stays readable).
  const threadTurns = Math.min(24, Math.max(6, (SCREW_H / RISE_SCALE / (pitchMm / 1000)) * 1));
  const thread = useMemo(() => new Helix(SCREW_R, SCREW_H, threadTurns), [threadTurns]);

  const place = () => {
    const f = motion.current.fraction;
    lift.current?.position.set(0, f * liftM * RISE_SCALE, 0);
    if (spin.current) spin.current.rotation.y = -2 * Math.PI * turns * f;
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, handleRadiusM, pitchMm, invalidate]);

  const R = handleRadiusM;
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      {/* Base with the nut */}
      <mesh position={[0, BASE_TOP / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.22, BASE_TOP, 32]} />
        <meshStandardMaterial color={c.surface} metalness={0.2} roughness={0.7} />
      </mesh>
      <group ref={lift}>
        <group ref={spin}>
          {/* Screw core and thread */}
          <mesh position={[0, BASE_TOP - 0.15 + SCREW_H / 2, 0]}>
            <cylinderGeometry args={[SCREW_R * 0.85, SCREW_R * 0.85, SCREW_H, 24]} />
            <meshStandardMaterial color={c.metal} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, BASE_TOP - 0.15, 0]}>
            <tubeGeometry args={[thread, Math.round(threadTurns * 24), 0.012, 6, false]} />
            <meshStandardMaterial color={c.metal} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Head and handle */}
          <mesh position={[0, BASE_TOP - 0.15 + SCREW_H + 0.03, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 24]} />
            <meshStandardMaterial color={c.ink} />
          </mesh>
          <mesh
            position={[R / 2, BASE_TOP - 0.15 + SCREW_H + 0.03, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.012, 0.012, R, 12]} />
            <meshStandardMaterial color={c.input} />
          </mesh>
          <mesh position={[R, BASE_TOP - 0.15 + SCREW_H + 0.03, 0]}>
            <sphereGeometry args={[0.03, 16, 12]} />
            <meshStandardMaterial color={c.input} />
          </mesh>
          <SceneLabel position={[R, BASE_TOP - 0.15 + SCREW_H + 0.12, 0]}>
            Effort (handle)
          </SceneLabel>
        </group>
        {/* Platform and load (do not spin) */}
        <mesh position={[0, BASE_TOP - 0.15 + SCREW_H + 0.07, 0]}>
          <boxGeometry args={[0.32, 0.02, 0.32]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
        <mesh position={[0, BASE_TOP - 0.15 + SCREW_H + 0.2, 0]}>
          <boxGeometry args={[0.3, 0.24, 0.3]} />
          <meshStandardMaterial color={c.output} roughness={0.7} />
        </mesh>
        <SceneLabel position={[-0.32, BASE_TOP - 0.15 + SCREW_H + 0.2, 0]}>Load</SceneLabel>
      </group>
      <SceneLabel position={[0.32, 0.12, 0.1]}>Nut in the base</SceneLabel>
      <gridHelper args={[4, 16, c.grid, c.grid]} />
      <OrbitControls
        makeDefault
        target={[0, 0.6, 0]}
        enablePan={false}
        minDistance={0.8}
        maxDistance={5}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
