import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { useUiStore } from '@/store/uiStore';
import { SceneLabel } from './SceneLabel';

interface WheelAxleSceneProps {
  wheelRadiusM: number;
  axleRadiusM: number;
  liftM: number;
  motion: MotionRef;
  playing: boolean;
}

const AXLE_Y = 1.3;
const LOAD = 0.26;
const EFFORT_START = 0.75; // effort rope length below the axle centre at the start (m)

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

function setRope(mesh: Mesh | null, x: number, yTop: number, yBottom: number) {
  if (!mesh) return;
  mesh.position.set(x, (yTop + yBottom) / 2, 0.06);
  mesh.scale.set(1, Math.max(0.001, yTop - yBottom), 1);
}

/**
 * Wheel and axle winch in metres. Wheel and axle turn together; the load rope winds onto the
 * axle and the effort rope unwinds from the wheel. The effort end stops at the floor in the
 * picture; the true distance pulled is shown in its label.
 */
export function WheelAxleScene({
  wheelRadiusM,
  axleRadiusM,
  liftM,
  motion,
  playing,
}: WheelAxleSceneProps) {
  const c = useColors();
  const invalidate = useThree((s) => s.invalidate);
  const wheel = useRef<Group>(null);
  const load = useRef<Group>(null);
  const loadRope = useRef<Mesh>(null);
  const effortRope = useRef<Mesh>(null);
  const handle = useRef<Group>(null);
  const dinText = useRef<HTMLSpanElement>(null);
  const ratio = wheelRadiusM / axleRadiusM;
  const loadRestTop = LOAD;

  const place = () => {
    const rise = motion.current.fraction * liftM;
    const pulled = rise * ratio;
    // Clockwise seen from the front (negative about z): winds the load rope up on the left.
    wheel.current?.rotation.set(0, 0, -rise / axleRadiusM);
    load.current?.position.set(-axleRadiusM, rise, 0);
    setRope(loadRope.current, -axleRadiusM, AXLE_Y, loadRestTop + rise);
    const handleY = Math.max(0.12, AXLE_Y - EFFORT_START - pulled);
    setRope(effortRope.current, wheelRadiusM, AXLE_Y, handleY);
    handle.current?.position.set(wheelRadiusM, handleY, 0.06);
    if (dinText.current)
      dinText.current.textContent = `Effort · rope pulled ${pulled.toFixed(2)} m`;
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, wheelRadiusM, axleRadiusM, invalidate]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.3} />
      {/* Stand */}
      {[-0.25, 0.25].map((z) => (
        <mesh key={z} position={[0, AXLE_Y / 2, z]}>
          <boxGeometry args={[0.06, AXLE_Y, 0.06]} />
          <meshStandardMaterial color={c.surface} />
        </mesh>
      ))}
      {/* Wheel + axle (one rigid body) */}
      <group ref={wheel} position={[0, AXLE_Y, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
          <cylinderGeometry args={[wheelRadiusM, wheelRadiusM, 0.04, 48]} />
          <meshStandardMaterial color={c.brand} roughness={0.5} />
        </mesh>
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
          <mesh key={a} rotation={[0, 0, a]} position={[0, 0, 0.085]}>
            <boxGeometry args={[wheelRadiusM * 2, 0.02, 0.01]} />
            <meshStandardMaterial color={c.surface} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[axleRadiusM, axleRadiusM, 0.56, 24]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
      </group>
      <SceneLabel position={[wheelRadiusM * 0.75 + 0.12, AXLE_Y + wheelRadiusM * 0.75, 0.12]}>
        Wheel
      </SceneLabel>
      <SceneLabel position={[0, AXLE_Y - 0.05, 0.42]}>Axle</SceneLabel>

      {/* Load rope and load */}
      <mesh ref={loadRope}>
        <cylinderGeometry args={[0.01, 0.01, 1, 8]} />
        <meshStandardMaterial color={c.ink} />
      </mesh>
      <group ref={load}>
        <mesh position={[0, LOAD / 2, 0.06]}>
          <boxGeometry args={[0.3, LOAD, 0.3]} />
          <meshStandardMaterial color={c.output} roughness={0.7} />
        </mesh>
        <SceneLabel position={[-0.3, LOAD / 2, 0.06]}>Load</SceneLabel>
      </group>

      {/* Effort rope and spring scale */}
      <mesh ref={effortRope}>
        <cylinderGeometry args={[0.012, 0.012, 1, 8]} />
        <meshStandardMaterial color={c.input} />
      </mesh>
      <group ref={handle}>
        <mesh>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color={c.input} />
        </mesh>
        <Html
          position={[0.35, 0, 0]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span
            ref={dinText}
            aria-hidden="true"
            className="block rounded-sm border border-rule bg-surface/90 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-ink shadow-pop"
          >
            Effort · rope pulled 0.00 m
          </span>
        </Html>
      </group>

      <gridHelper args={[4, 16, c.grid, c.grid]} />
      <OrbitControls
        makeDefault
        target={[0, 0.9, 0]}
        enablePan={false}
        minDistance={0.8}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
