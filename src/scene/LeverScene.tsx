import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { GlovedHand } from './realism/GlovedHand';
import { LabStage, Shadowed } from './realism/LabStage';
import { LoadObject } from './realism/Loads';
import { loadSize } from './realism/loadSize';
import { useLabMaterials } from './realism/materials';
import { useRealism } from './realism/quality';
import { SceneLabel } from './SceneLabel';

interface LeverSceneProps {
  effortArmM: number;
  loadArmM: number;
  rotationDeg: number;
  loadMassKg: number;
  pinRadiusM: number;
  motion: MotionRef;
  playing: boolean;
}

const PIVOT_Y = 0.55;
const PLANK_T = 0.045;
const PLANK_W = 0.11;

/**
 * First-class lever at true size: a wooden plank turning on a steel pin in an A-frame fulcrum,
 * a cement bag on the load arm, and a gloved hand on the effort arm. The plank turns from the
 * shared run motion; nothing here computes physics.
 */
export function LeverScene({
  effortArmM,
  loadArmM,
  rotationDeg,
  loadMassKg,
  pinRadiusM,
  motion,
  playing,
}: LeverSceneProps) {
  const m = useLabMaterials();
  const r = useRealism();
  const beam = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const offset = (loadArmM - effortArmM) / 2;
  const bag = loadSize('cement', loadMassKg);
  // The bag sits on the plank with its centre over the load point (the end of the load arm).
  const bagX = -loadArmM;

  const place = () => {
    const t = (motion.current.fraction * rotationDeg * Math.PI) / 180;
    beam.current?.rotation.set(0, 0, -t); // the effort end (+x) goes down
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, effortArmM, loadArmM, loadMassKg, invalidate]);

  const legSpread = 0.22;
  const legLen = Math.hypot(PIVOT_Y, legSpread);
  const legAngle = Math.atan2(legSpread, PIVOT_Y);
  return (
    <>
      <LabStage shadowArea={1.3} lightTarget={[0, 0.5, 0]} />
      <Shadowed>
        <group position={[offset, 0, 0]}>
          {/* A-frame fulcrum (front and back pairs of legs) with the steel pivot pin */}
          {[-1, 1].map((z) =>
            [-1, 1].map((sx) => (
              <mesh
                key={`${z}${sx}`}
                position={[(sx * legSpread) / 2, PIVOT_Y / 2, z * 0.09]}
                rotation={[0, 0, sx * legAngle]}
                material={m.framePaint}
              >
                <boxGeometry args={[0.035, legLen, 0.035]} />
              </mesh>
            )),
          )}
          <mesh position={[0, PIVOT_Y, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.steel}>
            <cylinderGeometry
              args={[
                Math.max(pinRadiusM, 0.008),
                Math.max(pinRadiusM, 0.008),
                0.24,
                r.segments / 2,
              ]}
            />
          </mesh>
          <SceneLabel position={[0, 0.12, 0.3]}>Fulcrum (pivot pin)</SceneLabel>

          <group ref={beam} position={[0, PIVOT_Y, 0]}>
            <mesh position={[(effortArmM - loadArmM) / 2, PLANK_T / 2 + 0.01, 0]} material={m.wood}>
              <boxGeometry args={[effortArmM + loadArmM + 0.06, PLANK_T, PLANK_W]} />
            </mesh>
            <group position={[bagX, PLANK_T + 0.01, 0]}>
              <LoadObject kind="cement" massKg={loadMassKg} />
              <SceneLabel
                position={[0, bag.h + 0.14, 0]}
              >{`Cement bag, ${loadMassKg} kg (load)`}</SceneLabel>
            </group>
            {/* palm down on the plank end, pressing */}
            <GlovedHand position={[effortArmM, PLANK_T + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <SceneLabel position={[effortArmM, 0.26, 0]}>Effort (hand pushes down)</SceneLabel>
            <SceneLabel position={[-loadArmM / 2, -0.12, 0.2]}>Load arm</SceneLabel>
            <SceneLabel position={[effortArmM / 2, -0.12, 0.2]}>Effort arm</SceneLabel>
          </group>
        </group>
      </Shadowed>
      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        enablePan={false}
        minDistance={0.5}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
