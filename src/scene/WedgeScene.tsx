import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Shape, type Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { GlovedHand } from './realism/GlovedHand';
import { LabStage, Shadowed } from './realism/LabStage';
import { LoadObject } from './realism/Loads';
import { loadSize } from './realism/loadSize';
import { useLabMaterials } from './realism/materials';
import { LabOrbitControls } from './LabOrbitControls';
import { SceneLabel } from './SceneLabel';

interface WedgeSceneProps {
  wedgeAngleDeg: number;
  pushM: number;
  loadMassKg: number;
  motion: MotionRef;
  playing: boolean;
}

const LEN = 0.45;
const DEPTH = 0.2;

/**
 * Lifting wedge at true size: a hardwood wedge slides along the floor under a concrete block held
 * by guides behind it. The flat-bottomed block rests on the slope by its uphill edge.
 */
export function WedgeScene({ wedgeAngleDeg, pushM, loadMassKg, motion, playing }: WedgeSceneProps) {
  const m = useLabMaterials();
  const invalidate = useThree((s) => s.invalidate);
  const wedge = useRef<Group>(null);
  const load = useRef<Group>(null);
  const tan = Math.tan((wedgeAngleDeg * Math.PI) / 180);
  const block = loadSize('block', loadMassKg);
  // Start with the tip just past the block's far edge, so the block already sits on the slope.
  const start = block.w / 2 + 0.02;

  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.lineTo(-LEN, 0);
    s.lineTo(-LEN, LEN * tan);
    s.closePath();
    return s;
  }, [tan]);

  const place = () => {
    const insert = start + pushM * motion.current.fraction;
    wedge.current?.position.set(insert, 0, -DEPTH / 2);
    load.current?.position.set(0, (insert + block.w / 2) * tan, 0);
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, wedgeAngleDeg, loadMassKg, invalidate]);

  return (
    <>
      <LabStage shadowArea={0.9} lightTarget={[0, 0.15, 0]} />
      <Shadowed>
        <group ref={wedge}>
          <mesh material={m.wood}>
            <extrudeGeometry args={[shape, { depth: DEPTH, bevelEnabled: false }]} />
          </mesh>
          {/* the hand pushes the thick end */}
          <GlovedHand
            position={[-LEN - 0.045, (LEN * tan) / 2, DEPTH / 2]}
            rotation={[0, 0, Math.PI / 2]}
          />
          <SceneLabel position={[-LEN - 0.1, LEN * tan + 0.12, DEPTH / 2]}>
            Effort (push the wedge)
          </SceneLabel>
        </group>
        {/* Guides behind the block: it can only move up and down */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[(s * block.w) / 2, 0.45, -Math.max(block.d, DEPTH) / 2 - 0.04]}
            material={m.framePaint}
          >
            <boxGeometry args={[0.03, 0.9, 0.03]} />
          </mesh>
        ))}
        <group ref={load}>
          <LoadObject kind="block" massKg={loadMassKg} />
          <SceneLabel
            position={[0, block.h + 0.1, 0]}
          >{`Concrete block, ${loadMassKg} kg (load)`}</SceneLabel>
        </group>
      </Shadowed>
      <LabOrbitControls
        makeDefault
        target={[0, 0.15, 0]}
        enablePan={false}
        minDistance={0.4}
        maxDistance={3}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
