import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { DRAWING, pulleyLayout } from '@/features/lab/pulley/layout';
import { useUiStore } from '@/store/uiStore';
import { SceneLabel } from './SceneLabel';

/**
 * 3D pulley system built from the same layout as the 2D diagram (one source of truth for which
 * pulleys are fixed or movable). Layout units → metres-ish world units at 0.01 per unit; the
 * same scale is used for load and rope travel so the velocity ratio is visible.
 */
const S = 0.01;
const {
  pxPerM: PX_PER_M,
  ceilingY: CEILING_Y,
  fixedY: FIXED_Y,
  restY: REST_Y,
  floorY: FLOOR_Y,
  effortStartY: EFFORT_START_Y,
} = DRAWING;
const ROPE_R = 0.012;
const LOAD_TOP = 0.46;

const wx = (x: number) => (x - 200) * S;
const wy = (y: number) => (FLOOR_Y - y) * S;

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

/** A vertical rope piece whose bottom (or top) end is moved every frame. */
function setRope(mesh: Mesh | null, x: number, yTop: number, yBottom: number) {
  if (!mesh) return;
  const len = Math.max(0.001, yTop - yBottom);
  mesh.position.set(x, (yTop + yBottom) / 2, 0);
  mesh.scale.set(1, len, 1);
}

export function PulleyScene({
  segments,
  motion,
  playing,
}: {
  segments: number;
  motion: MotionRef;
  playing: boolean;
}) {
  const c = useColors();
  const invalidate = useThree((s) => s.invalidate);
  const l = pulleyLayout(segments);
  const r = l.radius * S;
  const left = l.segmentXs[0] ?? 140;
  const right = l.segmentXs[segments - 1] ?? left;
  const loadCx = segments === 1 ? left : (left + right) / 2;
  const movable = l.sheaves.filter((s) => s.kind === 'movable');
  // Where the load's hanger attaches: under the movable block, or the rope hook when n = 1.
  const hookY = segments >= 2 ? wy(REST_Y) - r - 0.09 : wy(REST_Y);
  const segRefs = useRef<Array<Mesh | null>>([]);
  const effortRef = useRef<Mesh>(null);
  const movingRef = useRef<Group>(null);
  const handleRef = useRef<Group>(null);

  const place = () => {
    const rise = motion.current.fraction * PX_PER_M;
    const pull = segments * rise;
    l.segmentXs.forEach((x, i) => {
      const top = i === 0 && l.deadEnd === 'ceiling' ? CEILING_Y : FIXED_Y;
      setRope(segRefs.current[i] ?? null, wx(x), wy(top), wy(REST_Y - rise));
    });
    setRope(effortRef.current, wx(l.effortX), wy(FIXED_Y), wy(EFFORT_START_Y + pull));
    movingRef.current?.position.set(0, rise * S, 0);
    handleRef.current?.position.set(wx(l.effortX), wy(EFFORT_START_Y + pull) - 0.15, 0);
  };

  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, segments, invalidate]);

  const sheave = (x: number, y: number, color: string, key: string) => (
    <mesh key={key} position={[wx(x), wy(y), 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[r, r, 0.08, 32]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
    </mesh>
  );

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.3} />

      {/* Ceiling beam */}
      <mesh position={[wx(210), wy(CEILING_Y) + 0.06, 0]}>
        <boxGeometry args={[2.8, 0.12, 0.4]} />
        <meshStandardMaterial color={c.surface} />
      </mesh>

      {/* Fixed pulleys and hangers */}
      {l.sheaves
        .filter((s) => s.kind === 'fixed')
        .map((s) => (
          <group key={`f-${s.x}`}>
            {sheave(s.x, FIXED_Y, c.ink, `fs-${s.x}`)}
            <mesh position={[wx(s.x), (wy(CEILING_Y) + wy(FIXED_Y)) / 2, 0]}>
              <boxGeometry args={[0.03, wy(CEILING_Y) - wy(FIXED_Y), 0.03]} />
              <meshStandardMaterial color={c.ink} />
            </mesh>
          </group>
        ))}

      {/* Supporting rope segments and effort rope (unit-height cylinders scaled per frame) */}
      {l.segmentXs.map((x, i) => (
        <mesh
          key={`seg-${x}`}
          ref={(m) => {
            segRefs.current[i] = m;
          }}
        >
          <cylinderGeometry args={[ROPE_R, ROPE_R, 1, 8]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
      ))}
      <mesh ref={effortRef}>
        <cylinderGeometry args={[ROPE_R * 1.3, ROPE_R * 1.3, 1, 8]} />
        <meshStandardMaterial color={c.input} />
      </mesh>
      <group ref={handleRef}>
        <mesh>
          <boxGeometry args={[0.12, 0.3, 0.12]} />
          <meshStandardMaterial color={c.input} />
        </mesh>
        <SceneLabel position={[0.3, 0, 0]}>Effort (scale)</SceneLabel>
      </group>
      {l.sheaves.some((s) => s.kind === 'fixed') ? (
        <SceneLabel
          position={[
            wx(l.sheaves.find((s) => s.kind === 'fixed')?.x ?? 0) - 0.45,
            wy(FIXED_Y) + 0.1,
            0,
          ]}
        >
          Fixed pulley
        </SceneLabel>
      ) : null}

      {/* Moving parts */}
      <group ref={movingRef}>
        {movable.map((s) => sheave(s.x, REST_Y, c.brand, `ms-${s.x}`))}
        {movable.length ? (
          <SceneLabel position={[wx(left) - 0.5, wy(REST_Y), 0]}>Movable pulley</SceneLabel>
        ) : null}
        <SceneLabel position={[wx(loadCx), LOAD_TOP + 0.12, 0.3]}>Load</SceneLabel>
        {segments >= 2 ? (
          <mesh position={[wx((left + right) / 2), wy(REST_Y) - r - 0.05, 0]}>
            <boxGeometry args={[(right - left) * S + 0.25, 0.08, 0.12]} />
            <meshStandardMaterial color={c.brand} />
          </mesh>
        ) : null}
        <mesh position={[wx(loadCx), (LOAD_TOP + hookY) / 2, 0]}>
          <boxGeometry args={[0.02, hookY - LOAD_TOP, 0.02]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
        <mesh position={[wx(loadCx), LOAD_TOP / 2, 0]}>
          <boxGeometry args={[0.68, LOAD_TOP, 0.5]} />
          <meshStandardMaterial color={c.output} roughness={0.7} />
        </mesh>
      </group>

      <gridHelper args={[6, 12, c.grid, c.grid]} position={[0, 0, 0]} />
      <OrbitControls
        makeDefault
        target={[0.2, 1.6, 0]}
        enablePan={false}
        minDistance={2}
        maxDistance={9}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
