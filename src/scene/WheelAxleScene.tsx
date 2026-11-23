import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Vector3, type Group, type Mesh } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { GlovedHand } from './realism/GlovedHand';
import { LabStage, Shadowed } from './realism/LabStage';
import { LoadObject } from './realism/Loads';
import { loadSize } from './realism/loadSize';
import { useLabMaterials } from './realism/materials';
import { useRealism } from './realism/quality';
import { Rope } from './realism/Rope';
import { newSwing, stepSwing } from './realism/swing';
import { SceneLabel } from './SceneLabel';

interface WheelAxleSceneProps {
  wheelRadiusM: number;
  axleRadiusM: number;
  liftM: number;
  loadMassKg: number;
  motion: MotionRef;
  playing: boolean;
}

const AXLE_Y = 1.3;
const ROPE_R = 0.007;

function setRope(mesh: Mesh | null, x: number, yTop: number, yBottom: number) {
  if (!mesh) return;
  mesh.position.set(x, (yTop + yBottom) / 2, 0.06);
  mesh.scale.set(1, Math.max(0.001, yTop - yBottom), 1);
}

/**
 * Wheel and axle as a well winch, at true size. The wheel and axle turn together; the bucket's
 * rope winds onto the axle while the effort rope unwinds from the wheel. The hand stays at the
 * same height and the pulled rope piles up on the floor; its true length is shown in the label.
 */
export function WheelAxleScene({
  wheelRadiusM,
  axleRadiusM,
  liftM,
  loadMassKg,
  motion,
  playing,
}: WheelAxleSceneProps) {
  const m = useLabMaterials();
  const realism = useRealism();
  const invalidate = useThree((s) => s.invalidate);
  const wheel = useRef<Group>(null);
  const load = useRef<Group>(null);
  const swing = useRef<Group>(null);
  const sw = useRef(newSwing());
  const loadRope = useRef<Mesh>(null);
  const dinText = useRef<HTMLSpanElement>(null);
  const ratio = wheelRadiusM / axleRadiusM;
  const bucket = loadSize('bucket', loadMassKg);
  const bailTop = bucket.h + bucket.w / 2; // the bail handle arches above the rim
  const handY = Math.max(0.6, AXLE_Y - wheelRadiusM - 0.35);
  const pileA = useMemo(() => new Vector3(), []);
  const pileB = useMemo(() => new Vector3(), []);

  const place = (dt = 0) => {
    const f = motion.current.fraction;
    const rise = f * liftM;
    wheel.current?.rotation.set(0, 0, -rise / axleRadiusM);
    load.current?.position.set(-axleRadiusM, rise, 0.06);
    setRope(loadRope.current, -axleRadiusM, AXLE_Y, bailTop + rise);
    if (dinText.current) {
      dinText.current.textContent = `Effort · rope pulled ${(rise * ratio).toFixed(2)} m`;
    }
    const swinging = stepSwing(sw.current, dt, f, bailTop / 2 + 0.1, realism.motionEffects);
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
  }, [playing, wheelRadiusM, axleRadiusM, loadMassKg, invalidate]);

  const pileEnds = (): [Vector3, Vector3] => {
    pileA.set(wheelRadiusM, handY - 0.05, 0.06);
    pileB.set(wheelRadiusM + 0.3, 0.01, 0.3);
    return [pileA, pileB];
  };
  const pulled = () => motion.current.fraction * liftM * ratio;

  const spokes = [0, Math.PI / 3, (2 * Math.PI) / 3];
  return (
    <>
      <LabStage shadowArea={1.6} lightTarget={[0, 1, 0]} />
      <Shadowed>
        {/* Wooden frame with a steel bearing on each post */}
        {[-0.25, 0.25].map((z) => (
          <group key={z}>
            <mesh position={[0, AXLE_Y / 2, z]} material={m.wood}>
              <boxGeometry args={[0.08, AXLE_Y, 0.08]} />
            </mesh>
            <mesh position={[0, AXLE_Y, z]} rotation={[Math.PI / 2, 0, 0]} material={m.darkSteel}>
              <cylinderGeometry args={[0.035, 0.035, 0.09, 16]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.03, 0]} material={m.wood}>
          <boxGeometry args={[0.6, 0.06, 0.66]} />
        </mesh>

        {/* Wheel (steel rim and spokes) and axle: one rigid body */}
        <group ref={wheel} position={[0, AXLE_Y, 0]}>
          <mesh position={[0, 0, 0.06]} material={m.effortPaint}>
            <torusGeometry args={[wheelRadiusM, 0.014, 10, realism.segments * 2]} />
          </mesh>
          {spokes.map((a) => (
            <mesh key={a} rotation={[0, 0, a]} position={[0, 0, 0.06]} material={m.steel}>
              <boxGeometry args={[wheelRadiusM * 2, 0.012, 0.012]} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={m.steel}>
            <cylinderGeometry args={[axleRadiusM, axleRadiusM, 0.56, realism.segments]} />
          </mesh>
          {/* rope wound on the axle */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]} material={m.rope}>
            <cylinderGeometry
              args={[axleRadiusM + ROPE_R, axleRadiusM + ROPE_R, 0.12, realism.segments]}
            />
          </mesh>
        </group>
        <SceneLabel position={[wheelRadiusM * 0.75 + 0.12, AXLE_Y + wheelRadiusM * 0.75, 0.12]}>
          Wheel
        </SceneLabel>
        <SceneLabel position={[-0.2, AXLE_Y + 0.12, 0.42]}>Axle</SceneLabel>

        {/* Bucket rope and bucket */}
        <mesh ref={loadRope} material={m.rope}>
          <cylinderGeometry args={[ROPE_R, ROPE_R, 1, 8]} />
        </mesh>
        <group ref={load}>
          <group position={[0, bailTop, 0]}>
            <group ref={swing}>
              <group position={[0, -bailTop, 0]}>
                <LoadObject kind="bucket" massKg={loadMassKg} />
              </group>
            </group>
          </group>
          <SceneLabel
            position={[-0.4, bucket.h / 2, 0]}
          >{`Bucket of water, ${loadMassKg} kg (load)`}</SceneLabel>
        </group>

        {/* Effort rope from the wheel to the hand; the pulled rope piles on the floor */}
        <mesh position={[wheelRadiusM, (AXLE_Y + handY) / 2, 0.06]} material={m.rope}>
          <cylinderGeometry args={[ROPE_R, ROPE_R, AXLE_Y - handY, 8]} />
        </mesh>
        <mesh position={[wheelRadiusM, handY + 0.1, 0.06]} material={m.effortPaint}>
          <cylinderGeometry args={[0.018, 0.018, 0.14, 16]} />
        </mesh>
        <GlovedHand
          position={[wheelRadiusM, handY, 0.09]}
          rotation={[0, Math.PI / 2, Math.PI / 2]}
        />
        <Rope
          ends={pileEnds}
          segments={16}
          slack={() => 0.15 + pulled() / Math.max(pileA.distanceTo(pileB), 0.1)}
        />
        <Html
          position={[wheelRadiusM + 0.4, handY, 0]}
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
      </Shadowed>
      <OrbitControls
        makeDefault
        target={[0, 0.9, 0]}
        enablePan={false}
        minDistance={0.6}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
