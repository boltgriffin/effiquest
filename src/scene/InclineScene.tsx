import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { GlovedHand } from './realism/GlovedHand';
import { LabStage, Shadowed } from './realism/LabStage';
import { LoadObject } from './realism/Loads';
import { loadSize } from './realism/loadSize';
import { useLabMaterials } from './realism/materials';
import { Rope } from './realism/Rope';
import { LabOrbitControls } from './LabOrbitControls';
import { SceneLabel } from './SceneLabel';

interface InclineSceneProps {
  angleDeg: number;
  lengthM: number;
  massKg: number;
  motion: MotionRef;
  playing: boolean;
}

const PLANK_W = 0.6;
const PLANK_T = 0.035;
/** Rope from the crate to the hand, along the slope. */
const ROPE_LEN = 0.55;

/**
 * Inclined plane at true size: a wooden plank ramp `lengthM` long at `angleDeg`, resting on a
 * steel stand, with a crate sized from the load mass. The crate follows the shared run motion;
 * nothing here computes physics.
 */
export function InclineScene({ angleDeg, lengthM, massKg, motion, playing }: InclineSceneProps) {
  const m = useLabMaterials();
  const crate = useRef<Group>(null);
  const hand = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const t = (angleDeg * Math.PI) / 180;
  const base = lengthM * Math.cos(t);
  const height = lengthM * Math.sin(t);
  const size = loadSize('crate', massKg);

  // Points along the slope surface (local to the ramp group).
  const along = (s: number, up = 0) =>
    new Vector3(s * Math.cos(t) - up * Math.sin(t), s * Math.sin(t) + up * Math.cos(t), 0);
  const ropeA = useMemo(() => new Vector3(), []);
  const ropeB = useMemo(() => new Vector3(), []);

  const crateS = () =>
    size.w / 2 + motion.current.fraction * Math.max(0, lengthM - size.w - ROPE_LEN * 0.2);
  const place = () => {
    const s = crateS();
    crate.current?.position.copy(along(s));
    crate.current?.rotation.set(0, 0, t);
    const front = s + size.w / 2;
    hand.current?.position.copy(along(front + ROPE_LEN, size.h * 0.45));
    hand.current?.rotation.set(0, 0, t);
  };
  const ropeEnds = (): [Vector3, Vector3] => {
    const front = crateS() + size.w / 2;
    ropeA.copy(along(front, size.h * 0.45));
    ropeB.copy(along(front + ROPE_LEN, size.h * 0.45));
    return [ropeA, ropeB];
  };

  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, angleDeg, lengthM, massKg, invalidate]);

  const mid = along(lengthM / 2, -PLANK_T / 2);
  return (
    <>
      <LabStage shadowArea={Math.max(1.2, lengthM)} lightTarget={[0, height / 2, 0]} />
      <Shadowed>
        <group position={[-base / 2, 0, 0]}>
          {/* Plank: its top surface is the ramp line from (0,0) to (base, height) */}
          <mesh position={[mid.x, mid.y, 0]} rotation={[0, 0, t]} material={m.wood}>
            <boxGeometry args={[lengthM, PLANK_T, PLANK_W]} />
          </mesh>
          {/* Steel stand under the top end */}
          {[-1, 1].map((z) => (
            <mesh
              key={z}
              position={[base - 0.03, (height - PLANK_T) / 2, (z * (PLANK_W - 0.08)) / 2]}
              material={m.darkSteel}
            >
              <boxGeometry args={[0.04, Math.max(0.01, height - PLANK_T), 0.04]} />
            </mesh>
          ))}
          <mesh
            position={[base - 0.03, Math.max(0.02, height - PLANK_T - 0.02), 0]}
            material={m.darkSteel}
          >
            <boxGeometry args={[0.05, 0.04, PLANK_W]} />
          </mesh>
          <SceneLabel position={[base * 0.7, height * 0.35 + 0.12, PLANK_W / 2 + 0.05]}>
            Ramp
          </SceneLabel>

          <group ref={crate}>
            <LoadObject kind="crate" massKg={massKg} />
            <SceneLabel position={[0, size.h + 0.12, 0]}>{`Crate, ${massKg} kg (load)`}</SceneLabel>
          </group>
          <Rope ends={ropeEnds} />
          <group ref={hand}>
            <GlovedHand rotation={[Math.PI / 2, 0, 0]} />
            <SceneLabel position={[0.12, 0.14, 0]}>Effort</SceneLabel>
          </group>
        </group>
      </Shadowed>
      <LabOrbitControls
        makeDefault
        target={[0, height / 2, 0]}
        enablePan={false}
        minDistance={0.6}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
