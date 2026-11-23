import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { GlovedHand } from './realism/GlovedHand';
import { LabStage, Shadowed } from './realism/LabStage';
import { LoadObject } from './realism/Loads';
import { loadSize } from './realism/loadSize';
import { useLabMaterials } from './realism/materials';
import { useRealism } from './realism/quality';
import { SceneLabel } from './SceneLabel';

interface HydraulicSceneProps {
  inputDiameterM: number;
  outputDiameterM: number;
  loadMassKg: number;
  liftM: number;
  motion: MotionRef;
  playing: boolean;
}

/** One pump stroke of the small piston (m). A real jack pumps many short strokes. */
const STROKE_M = 0.1;
const BASE_H = 0.06;
const LX = -0.22;
const RX = 0.16;
const SMALL_H = 0.32;
const LARGE_H = 0.22;
const WALL = 0.004;

/**
 * Hydraulic press at true size: glass cylinders show the oil. The small piston is pumped in
 * 10 cm strokes (the physics model treats the total as one long push; readouts show the total).
 * The load rises its true distance.
 */
export function HydraulicScene({
  inputDiameterM,
  outputDiameterM,
  loadMassKg,
  liftM,
  motion,
  playing,
}: HydraulicSceneProps) {
  const m = useLabMaterials();
  const r = useRealism();
  const invalidate = useThree((s) => s.invalidate);
  const r1 = inputDiameterM / 2;
  const r2 = outputDiameterM / 2;
  const ratio = (r2 * r2) / (r1 * r1);
  const block = loadSize('block', loadMassKg);
  const inPiston = useRef<Group>(null);
  const outPiston = useRef<Group>(null);
  const inFluid = useRef<Mesh>(null);
  const outFluid = useRef<Mesh>(null);
  const inTop = BASE_H + SMALL_H - 0.02; // small piston face at the top of a stroke
  const outStart = BASE_H + 0.08; // large piston face with the load down
  /** Platform height above the large piston face: just clear of the cylinder top at the start. */
  const PLATFORM = BASE_H + LARGE_H + 0.012 - (BASE_H + 0.08);

  const place = () => {
    const rise = motion.current.fraction * liftM;
    const travel = rise * ratio;
    // Within the current stroke: 0 at the top, STROKE_M at the bottom (sawtooth).
    const strokes = travel / STROKE_M;
    const done = motion.current.fraction >= 1;
    const depth = done ? 0 : (strokes - Math.floor(strokes)) * STROKE_M;
    const yIn = inTop - depth;
    const yOut = outStart + rise;
    inPiston.current?.position.set(LX, yIn, 0);
    outPiston.current?.position.set(RX, yOut, 0);
    const fl = (mesh: Mesh | null, x: number, top: number) => {
      if (!mesh) return;
      mesh.position.set(x, (top + BASE_H) / 2, 0);
      mesh.scale.set(1, Math.max(0.001, top - BASE_H), 1);
    };
    fl(inFluid.current, LX, yIn);
    fl(outFluid.current, RX, yOut);
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, inputDiameterM, outputDiameterM, loadMassKg, invalidate]);

  const seg = r.segments;
  const glass = (x: number, rad: number, h: number) => (
    <mesh position={[x, BASE_H + h / 2, 0]} material={m.glass}>
      <cylinderGeometry args={[rad + WALL, rad + WALL, h, seg, 1, true]} />
    </mesh>
  );
  return (
    <>
      <LabStage shadowArea={0.8} lightTarget={[0, 0.25, 0]} />
      <Shadowed>
        {/* Steel base with the oil passage between the cylinders */}
        <mesh position={[(LX + RX) / 2, BASE_H / 2, 0]} material={m.darkSteel}>
          <boxGeometry args={[RX - LX + r2 * 2 + 0.12, BASE_H, Math.max(r2 * 2, 0.06) + 0.08]} />
        </mesh>
        {glass(LX, r1, SMALL_H)}
        {glass(RX, r2, LARGE_H)}
        <mesh ref={inFluid} material={m.oil}>
          <cylinderGeometry args={[r1, r1, 1, seg]} />
        </mesh>
        <mesh ref={outFluid} material={m.oil}>
          <cylinderGeometry args={[r2, r2, 1, seg]} />
        </mesh>

        {/* Small piston, rod and the hand pushing it */}
        <group ref={inPiston}>
          <mesh position={[0, 0.01, 0]} material={m.steel}>
            <cylinderGeometry args={[r1, r1, 0.02, seg]} />
          </mesh>
          <mesh position={[0, 0.13, 0]} material={m.steel}>
            <cylinderGeometry args={[0.005, 0.005, 0.24, 8]} />
          </mesh>
          <mesh position={[0, 0.255, 0]} rotation={[0, 0, Math.PI / 2]} material={m.effortPaint}>
            <cylinderGeometry args={[0.014, 0.014, 0.1, 12]} />
          </mesh>
          {/* palm down on the knob, pressing */}
          <GlovedHand position={[0, 0.262, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <SceneLabel position={[-0.2, 0.3, 0]}>Effort (small piston)</SceneLabel>
        </group>

        {/* Large piston, platform and the load */}
        <group ref={outPiston}>
          <mesh position={[0, 0.01, 0]} material={m.steel}>
            <cylinderGeometry args={[r2, r2, 0.02, seg]} />
          </mesh>
          <mesh position={[0, PLATFORM / 2, 0]} material={m.steel}>
            <cylinderGeometry
              args={[Math.min(r2 * 0.6, 0.025), Math.min(r2 * 0.6, 0.025), PLATFORM - 0.02, seg]}
            />
          </mesh>
          <mesh position={[0, PLATFORM, 0]} material={m.framePaint}>
            <boxGeometry
              args={[Math.max(block.w, 0.2) + 0.04, 0.02, Math.max(block.d, 0.2) + 0.04]}
            />
          </mesh>
          <group position={[0, PLATFORM + 0.01, 0]}>
            <LoadObject kind="block" massKg={loadMassKg} />
          </group>
          <SceneLabel
            position={[0.32, PLATFORM + block.h / 2, 0]}
          >{`Concrete block, ${loadMassKg} kg (load)`}</SceneLabel>
        </group>
        <SceneLabel position={[(LX + RX) / 2, 0.02, 0.18]}>
          Oil: same pressure everywhere
        </SceneLabel>
      </Shadowed>
      <OrbitControls
        makeDefault
        target={[0, 0.3, 0]}
        enablePan={false}
        minDistance={0.4}
        maxDistance={4}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
