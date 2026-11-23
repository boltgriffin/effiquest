import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, type Group, type Mesh } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { pulleyLayout, SPACING } from '@/features/lab/pulley/layout';
import { PULLEY_GEOMETRY } from '@/features/lab/pulley/params';
import { GlovedHand } from './realism/GlovedHand';
import { LabStage, Shadowed } from './realism/LabStage';
import { LoadObject } from './realism/Loads';
import { loadSize } from './realism/loadSize';
import { useLabMaterials } from './realism/materials';
import { useRealism } from './realism/quality';
import { Rope } from './realism/Rope';
import { newSwing, stepSwing } from './realism/swing';
import { SceneLabel } from './SceneLabel';

/**
 * Block and tackle at true size, built from the same reeving layout as the 2D diagram (one
 * source of truth for which pulleys are fixed or movable). Heights are 1:1 (the real 1 m lift);
 * the hauling hand stays at chest height and the pulled rope piles up on the floor, as in a real
 * lift. When the sack leaves the floor it swings a little (visual only).
 */
const R = PULLEY_GEOMETRY.sheaveRadiusM; // sheave radius, the same as the physics model
const SX = (2 * R) / SPACING; // layout units → metres across
const BEAM_Y = 3.0;
const FIXED_Y = 2.72;
const HAND_Y = 1.25;
const ROPE_R = 0.007;
const HOOK = 0.09;

function setRope(mesh: Mesh | null, x: number, yTop: number, yBottom: number) {
  if (!mesh) return;
  const len = Math.max(0.001, yTop - yBottom);
  mesh.position.set(x, (yTop + yBottom) / 2, 0);
  mesh.scale.set(1, len, 1);
}

export function PulleyScene({
  segments,
  loadMassKg,
  liftM,
  motion,
  playing,
}: {
  segments: number;
  loadMassKg: number;
  liftM: number;
  motion: MotionRef;
  playing: boolean;
}) {
  const m = useLabMaterials();
  const realism = useRealism();
  const invalidate = useThree((s) => s.invalidate);
  const l = pulleyLayout(segments);
  const cx = (l.segmentXs[0]! + l.effortX) / 2;
  const wx = (x: number) => (x - cx) * SX;
  const sack = loadSize('sack', loadMassKg);
  const movable = l.sheaves.filter((s) => s.kind === 'movable');
  const fixed = l.sheaves.filter((s) => s.kind === 'fixed');

  // Rest heights: sack on the floor, hook above it, movable block above the hook.
  const hookY0 = sack.h + sack.d * 0.3 + HOOK;
  const movY0 = hookY0 + R + 0.06;
  const segRefs = useRef<Array<Mesh | null>>([]);
  const effortRef = useRef<Mesh>(null);
  const moving = useRef<Group>(null);
  const swing = useRef<Group>(null);
  const sw = useRef(newSwing());
  const effortX = wx(l.effortX);
  const pileA = useMemo(() => new Vector3(), []);
  const pileB = useMemo(() => new Vector3(), []);

  const place = (dt = 0) => {
    const f = motion.current.fraction;
    const rise = f * liftM;
    l.segmentXs.forEach((x, i) => {
      const top = i === 0 && l.deadEnd === 'ceiling' ? BEAM_Y : FIXED_Y;
      const bottom = segments === 1 ? hookY0 + rise : movY0 + rise;
      setRope(segRefs.current[i] ?? null, wx(x), top, bottom);
    });
    setRope(effortRef.current, effortX, FIXED_Y, HAND_Y + 0.16);
    moving.current?.position.set(0, rise, 0);

    const swinging = stepSwing(
      sw.current,
      dt,
      f,
      HOOK + sack.h / 2 + sack.d * 0.3,
      realism.motionEffects,
    );
    swing.current?.rotation.set(0, 0, sw.current.angle);
    return swinging;
  };

  useFrame((_, delta) => {
    const swinging = place(delta);
    if (motion.current.playing || swinging) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, segments, loadMassKg, invalidate]);

  const pileEnds = (): [Vector3, Vector3] => {
    pileA.set(effortX, HAND_Y - 0.05, 0);
    pileB.set(effortX + 0.35, 0.01, 0.25);
    return [pileA, pileB];
  };
  const pulled = () => segments * motion.current.fraction * liftM;

  const sheave = (x: number, y: number, key: string) => (
    <group key={key} position={[x, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={m.steel}>
        <cylinderGeometry args={[R, R, 0.035, realism.segments]} />
      </mesh>
      {/* cheek plates */}
      {[-1, 1].map((z) => (
        <mesh key={z} position={[0, 0, z * 0.026]} material={m.framePaint}>
          <boxGeometry args={[R * 2.3, R * 2.3, 0.008]} />
        </mesh>
      ))}
    </group>
  );

  const span = Math.max(1.2, wx(l.effortX) - wx(l.segmentXs[0]!) + 0.8);
  return (
    <>
      <LabStage shadowArea={2.2} lightTarget={[0, 1.5, 0]} />
      <Shadowed>
        {/* Steel beam on two posts */}
        <mesh position={[0, BEAM_Y + 0.06, 0]} material={m.framePaint}>
          <boxGeometry args={[span, 0.12, 0.12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[(s * span) / 2, (BEAM_Y + 0.06) / 2, 0]} material={m.framePaint}>
            <boxGeometry args={[0.1, BEAM_Y + 0.06, 0.1]} />
          </mesh>
        ))}

        {/* Fixed pulleys hanging from the beam */}
        {fixed.map((s) => (
          <group key={`f-${s.x}`}>
            {sheave(wx(s.x), FIXED_Y, `fs-${s.x}`)}
            <mesh position={[wx(s.x), (BEAM_Y + FIXED_Y + R) / 2, 0]} material={m.darkSteel}>
              <cylinderGeometry args={[0.012, 0.012, BEAM_Y - FIXED_Y - R, 8]} />
            </mesh>
          </group>
        ))}
        {fixed[0] ? (
          <SceneLabel position={[wx(fixed[0].x) - 0.4, FIXED_Y + 0.12, 0]}>Fixed pulley</SceneLabel>
        ) : null}

        {/* Supporting rope segments and the hauling rope (scaled per frame) */}
        {l.segmentXs.map((x, i) => (
          <mesh
            key={`seg-${x}`}
            ref={(mm) => {
              segRefs.current[i] = mm;
            }}
            material={m.rope}
          >
            <cylinderGeometry args={[ROPE_R, ROPE_R, 1, 8]} />
          </mesh>
        ))}
        <mesh ref={effortRef} material={m.rope}>
          <cylinderGeometry args={[ROPE_R, ROPE_R, 1, 8]} />
        </mesh>

        {/* Spring scale and hand on the hauling rope; the pulled rope piles on the floor */}
        <mesh position={[effortX, HAND_Y + 0.1, 0]} material={m.effortPaint}>
          <cylinderGeometry args={[0.018, 0.018, 0.14, 16]} />
        </mesh>
        <GlovedHand position={[effortX, HAND_Y, 0.03]} rotation={[0, Math.PI / 2, Math.PI / 2]} />
        <SceneLabel position={[effortX + 0.32, HAND_Y + 0.1, 0]}>Effort (spring scale)</SceneLabel>
        <Rope
          ends={pileEnds}
          segments={18}
          slack={() => 0.15 + pulled() / Math.max(pileB.distanceTo(pileA), 0.1)}
        />

        {/* Moving parts: movable block, hook and the sack */}
        <group ref={moving}>
          {movable.map((s) => sheave(wx(s.x), movY0, `ms-${s.x}`))}
          {movable.length ? (
            <SceneLabel position={[wx(l.segmentXs[0]!) - 0.42, movY0, 0]}>
              Movable pulley
            </SceneLabel>
          ) : null}
          {segments >= 2 ? (
            <mesh
              position={[
                wx((l.segmentXs[0]! + l.segmentXs[segments - 1]!) / 2),
                movY0 - R - 0.03,
                0,
              ]}
              material={m.framePaint}
            >
              <boxGeometry args={[(segments - 1) * 2 * R + 0.06, 0.03, 0.06]} />
            </mesh>
          ) : null}
          <group
            position={[
              segments === 1
                ? wx(l.segmentXs[0]!)
                : wx((l.segmentXs[0]! + l.segmentXs[segments - 1]!) / 2),
              hookY0,
              0,
            ]}
          >
            <group ref={swing}>
              <mesh position={[0, -0.02, 0]} rotation={[0, 0, Math.PI]} material={m.darkSteel}>
                <torusGeometry args={[0.025, 0.006, 6, 16, Math.PI * 1.4]} />
              </mesh>
              <group position={[0, -hookY0, 0]}>
                <LoadObject kind="sack" massKg={loadMassKg} />
                <SceneLabel
                  position={[-0.42, sack.h * 0.6, 0]}
                >{`Rice sack, ${loadMassKg} kg (load)`}</SceneLabel>
              </group>
            </group>
          </group>
        </group>
      </Shadowed>
      <OrbitControls
        makeDefault
        target={[0, 1.5, 0]}
        enablePan={false}
        minDistance={1.2}
        maxDistance={9}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
