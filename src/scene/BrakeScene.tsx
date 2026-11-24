import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CatmullRomCurve3, Vector3, type Group } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { LabStage, Shadowed } from './realism/LabStage';
import { useLabMaterials } from './realism/materials';
import { useRealism } from './realism/quality';
import { LabOrbitControls } from './LabOrbitControls';
import { SceneLabel } from './SceneLabel';

interface BrakeSceneProps {
  pedalRatio: number;
  masterDiameterM: number;
  caliperDiameterM: number;
  pedalArmM: number;
  pedalTravelM: number;
  discRadiusM: number;
  wheelRadiusM: number;
  motion: MotionRef;
  playing: boolean;
}

const PIVOT = new Vector3(-0.7, 0.85, 0);
const WHEEL_X = 0.55;

/**
 * Hydraulic brake at true size: pedal (lever) and master cylinder on the left, the brake line,
 * and a car wheel with its disc, caliper and pads on the right. The pedal moves its true (small)
 * distance; the wheel turns at the start and slows to a stop as the pads squeeze the disc.
 */
export function BrakeScene({
  pedalRatio,
  masterDiameterM,
  caliperDiameterM,
  pedalArmM,
  pedalTravelM,
  discRadiusM,
  wheelRadiusM,
  motion,
  playing,
}: BrakeSceneProps) {
  const m = useLabMaterials();
  const r = useRealism();
  const invalidate = useThree((s) => s.invalidate);
  const pedal = useRef<Group>(null);
  const wheel = useRef<Group>(null);
  const seg = r.segments;
  const pushY = PIVOT.y - pedalArmM / pedalRatio;
  const masterX = PIVOT.x + 0.07;
  const masterLen = 0.16;
  const hubY = wheelRadiusM;
  const caliperPos = new Vector3(WHEEL_X, hubY + discRadiusM - 0.02, 0.09); // inner side, facing the viewer

  const line = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(masterX + masterLen, pushY, 0),
        new Vector3(masterX + masterLen + 0.25, pushY + 0.05, -0.15),
        new Vector3(WHEEL_X - 0.35, hubY + 0.45, 0.15),
        new Vector3(WHEEL_X - 0.05, caliperPos.y + 0.08, 0.12),
        caliperPos.clone(),
      ]),
    // caliperPos is derived from these
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masterX, pushY, hubY, discRadiusM, wheelRadiusM],
  );

  const place = () => {
    const f = motion.current.fraction;
    pedal.current?.rotation.set(0, 0, (f * pedalTravelM) / pedalArmM);
    // Spinning at the start, slowing evenly to a stop as the clamp force acts.
    wheel.current?.rotation.set(0, 0, -14 * (f - (f * f) / 2));
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, pedalRatio, invalidate]);

  const tyreTube = 0.09;
  return (
    <>
      <LabStage shadowArea={1.4} lightTarget={[0, 0.5, 0]} />
      <Shadowed>
        {/* Pedal box: bracket, pivot and the pedal lever */}
        <mesh position={[PIVOT.x, PIVOT.y + 0.05, 0]} material={m.darkSteel}>
          <boxGeometry args={[0.12, 0.1, 0.08]} />
        </mesh>
        <group position={PIVOT}>
          <group ref={pedal}>
            <mesh position={[-0.01, -pedalArmM / 2, 0]} material={m.darkSteel}>
              <boxGeometry args={[0.02, pedalArmM, 0.03]} />
            </mesh>
            <RoundedBox
              args={[0.03, 0.08, 0.1]}
              radius={0.008}
              smoothness={2}
              position={[-0.03, -pedalArmM, 0]}
              material={m.rubber}
            />
            {/* the driver's shoe on the pedal (effort) */}
            <RoundedBox
              args={[0.1, 0.11, 0.1]}
              radius={0.03}
              smoothness={3}
              position={[-0.1, -pedalArmM + 0.01, 0]}
              material={m.effortPaint}
            />
            {/* pushrod from the lever to the master cylinder */}
            <mesh
              position={[0.035, -pedalArmM / pedalRatio, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={m.steel}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.07, 8]} />
            </mesh>
          </group>
        </group>
        <SceneLabel position={[PIVOT.x - 0.28, PIVOT.y - pedalArmM + 0.05, 0]}>
          Effort (foot on the pedal)
        </SceneLabel>

        {/* Master cylinder with its fluid reservoir */}
        <mesh
          position={[masterX + masterLen / 2, pushY, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={m.steel}
        >
          <cylinderGeometry
            args={[masterDiameterM / 2 + 0.008, masterDiameterM / 2 + 0.008, masterLen, seg]}
          />
        </mesh>
        <mesh position={[masterX + masterLen / 2, pushY + 0.06, 0]} material={m.glass}>
          <boxGeometry args={[0.1, 0.06, 0.05]} />
        </mesh>
        <mesh position={[masterX + masterLen / 2, pushY + 0.05, 0]} material={m.oil}>
          <boxGeometry args={[0.095, 0.04, 0.045]} />
        </mesh>
        <SceneLabel position={[masterX + masterLen / 2, pushY + 0.16, 0]}>
          Master cylinder
        </SceneLabel>

        {/* Brake line */}
        <mesh material={m.rubber}>
          <tubeGeometry args={[line, 64, 0.005, 8, false]} />
        </mesh>
        <SceneLabel position={[0, hubY + 0.55, 0.1]}>Brake line (fluid)</SceneLabel>

        {/* Wheel, disc and caliper */}
        <group position={[WHEEL_X, hubY, 0]}>
          <group ref={wheel}>
            <mesh material={m.rubber}>
              <torusGeometry args={[wheelRadiusM - tyreTube, tyreTube, 16, seg * 2]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]} material={m.steel}>
              <cylinderGeometry
                args={[wheelRadiusM - tyreTube * 1.6, wheelRadiusM - tyreTube * 1.6, 0.12, seg * 2]}
              />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh
                key={i}
                rotation={[Math.PI / 2, 0, 0]}
                position={[
                  Math.cos((i * 2 * Math.PI) / 5) * 0.05,
                  Math.sin((i * 2 * Math.PI) / 5) * 0.05,
                  -0.085,
                ]}
                material={m.darkSteel}
              >
                <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
              </mesh>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.09]} material={m.steel}>
              <cylinderGeometry args={[discRadiusM, discRadiusM, 0.012, seg * 2]} />
            </mesh>
          </group>
        </group>
        <group position={caliperPos}>
          <mesh material={m.framePaint}>
            <boxGeometry args={[0.12, Math.max(0.06, caliperDiameterM + 0.02), 0.06]} />
          </mesh>
        </group>
        <SceneLabel position={[WHEEL_X + 0.28, hubY + discRadiusM + 0.08, 0.09]}>
          Caliper and pads on the disc
        </SceneLabel>
      </Shadowed>
      <LabOrbitControls
        makeDefault
        target={[0, 0.45, 0]}
        enablePan={false}
        minDistance={0.5}
        maxDistance={5}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
