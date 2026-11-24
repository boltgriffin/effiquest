import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Curve, Vector3, type Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { GlovedHand } from './realism/GlovedHand';
import { LabStage, Shadowed } from './realism/LabStage';
import { LoadObject } from './realism/Loads';
import { loadSize } from './realism/loadSize';
import { useLabMaterials } from './realism/materials';
import { useRealism } from './realism/quality';
import { LabOrbitControls } from './LabOrbitControls';
import { SceneLabel } from './SceneLabel';

interface ScrewSceneProps {
  handleRadiusM: number;
  pitchMm: number;
  threadRadiusM: number;
  liftM: number;
  loadMassKg: number;
  motion: MotionRef;
  playing: boolean;
}

const BASE_H = 0.12;
const SCREW_LEN = 0.2;
const SADDLE = 0.24;

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

/**
 * Screw jack at true size: a 12 mm square-ish thread with the real pitch (one turn per pitch of
 * screw length), a handle of the real radius turned by a gloved hand, and a concrete block on the
 * saddle. The load rises its true 20 mm.
 */
export function ScrewScene({
  handleRadiusM,
  pitchMm,
  threadRadiusM,
  liftM,
  loadMassKg,
  motion,
  playing,
}: ScrewSceneProps) {
  const m = useLabMaterials();
  const r = useRealism();
  const invalidate = useThree((s) => s.invalidate);
  const lift = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const pitch = pitchMm / 1000;
  const turnsTotal = liftM / pitch;
  const threadTurns = SCREW_LEN / pitch;
  const thread = useMemo(
    () => new Helix(threadRadiusM, SCREW_LEN, threadTurns),
    [threadRadiusM, threadTurns],
  );
  const block = loadSize('steel', loadMassKg);
  const headY = BASE_H + SCREW_LEN - 0.06;

  const place = () => {
    const f = motion.current.fraction;
    lift.current?.position.set(0, f * liftM, 0);
    if (spin.current) spin.current.rotation.y = -2 * Math.PI * turnsTotal * f;
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, handleRadiusM, pitchMm, loadMassKg, invalidate]);

  const R = handleRadiusM;
  const seg = r.segments;
  return (
    <>
      <LabStage shadowArea={0.9} lightTarget={[0, 0.3, 0]} />
      <Shadowed>
        {/* Cast base holding the nut */}
        <mesh position={[0, BASE_H / 2, 0]} material={m.darkSteel}>
          <cylinderGeometry args={[0.05, 0.11, BASE_H, seg]} />
        </mesh>
        <SceneLabel position={[0.16, 0.06, 0.1]}>Nut in the base</SceneLabel>
        <group ref={lift}>
          <group ref={spin}>
            <mesh position={[0, BASE_H - 0.06 + SCREW_LEN / 2, 0]} material={m.steel}>
              <cylinderGeometry args={[threadRadiusM * 0.8, threadRadiusM * 0.8, SCREW_LEN, seg]} />
            </mesh>
            <mesh position={[0, BASE_H - 0.06, 0]} material={m.steel}>
              <tubeGeometry
                args={[
                  thread,
                  Math.min(1200, Math.round(threadTurns * 20)),
                  Math.max(0.0012, pitch * 0.22),
                  6,
                  false,
                ]}
              />
            </mesh>
            {/* Head with a cross-hole and the handle bar */}
            <mesh position={[0, headY + 0.02, 0]} material={m.darkSteel}>
              <cylinderGeometry args={[0.022, 0.022, 0.04, seg]} />
            </mesh>
            <mesh
              position={[R / 2, headY + 0.02, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={m.steel}
            >
              <cylinderGeometry args={[0.008, 0.008, R, 12]} />
            </mesh>
            <mesh
              position={[R, headY + 0.02, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={m.effortPaint}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.1, 12]} />
            </mesh>
            <GlovedHand position={[R, headY + 0.02, 0]} rotation={[0, 0, 0]} />
            <SceneLabel position={[R, headY + 0.13, 0]}>Effort (hand on the handle)</SceneLabel>
          </group>
          {/* Saddle and load (do not turn) */}
          <mesh position={[0, headY + 0.05, 0]} material={m.framePaint}>
            <cylinderGeometry args={[SADDLE / 2, SADDLE / 2, 0.02, seg]} />
          </mesh>
          <group position={[0, headY + 0.06, 0]}>
            <LoadObject kind="steel" massKg={loadMassKg} />
          </group>
          <SceneLabel position={[-block.w / 2 - 0.2, headY + 0.06 + block.h / 2, 0]}>
            {`Steel billet, ${loadMassKg} kg (load)`}
          </SceneLabel>
        </group>
      </Shadowed>
      <LabOrbitControls
        makeDefault
        target={[0, 0.3, 0]}
        enablePan={false}
        minDistance={0.25}
        maxDistance={4}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
