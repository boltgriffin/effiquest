import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import { Quaternion, Vector3, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import type { MotionRef } from '@/features/lab/motion';
import { LabStage, Shadowed } from './realism/LabStage';
import { useLabMaterials } from './realism/materials';
import { useRealism } from './realism/quality';
import { SceneLabel } from './SceneLabel';

interface BicycleSceneProps {
  slopePercent: number;
  wheelRadiusM: number;
  crankM: number;
  chainringRadiusM: number;
  sprocketRadiusM: number;
  distanceM: number;
  massKg: number;
  motion: MotionRef;
  playing: boolean;
}

const UP = new Vector3(0, 1, 0);

/** A tube between two points (frame tubes, chain runs). */
function Tube({
  a,
  b,
  radius,
  material,
}: {
  a: [number, number, number];
  b: [number, number, number];
  radius: number;
  material: MeshStandardMaterial;
}) {
  const { pos, quat, len } = useMemo(() => {
    const va = new Vector3(...a);
    const vb = new Vector3(...b);
    const d = vb.clone().sub(va);
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new Quaternion().setFromUnitVectors(UP, d.clone().normalize()),
      len: d.length(),
    };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={material}>
      <cylinderGeometry args={[radius, radius, len, 12]} />
    </mesh>
  );
}

/**
 * A bicycle at true size on a hill tilted to its real angle. The wheels and the crank turn in the
 * true gear ratio while the road slides past underneath (so the camera can stay close).
 */
export function BicycleScene({
  slopePercent,
  wheelRadiusM: Rw,
  crankM,
  chainringRadiusM: r1,
  sprocketRadiusM: r2,
  distanceM,
  massKg,
  motion,
  playing,
}: BicycleSceneProps) {
  const m = useLabMaterials();
  const r = useRealism();
  const invalidate = useThree((s) => s.invalidate);
  const rear = useRef<Group>(null);
  const front = useRef<Group>(null);
  const crank = useRef<Group>(null);
  const hText = useRef<HTMLSpanElement>(null);
  const roadMesh = useRef<Mesh>(null);
  const alpha = Math.atan(slopePercent / 100);
  // The road has its own copy of the concrete material so its texture can slide.
  const road = useMemo(() => {
    const mat = m.concrete.clone();
    if (mat.map) {
      mat.map = mat.map.clone();
      mat.map.repeat.set(8, 1);
    }
    return mat;
  }, [m.concrete]);
  useEffect(() => () => road.dispose(), [road]);

  const place = () => {
    const d = motion.current.fraction * distanceM;
    const wheelAngle = d / Rw;
    rear.current?.rotation.set(0, 0, -wheelAngle);
    front.current?.rotation.set(0, 0, -wheelAngle);
    crank.current?.rotation.set(0, 0, -wheelAngle * (r2 / r1));
    // The road slides back under the bike: 6 m of road with the texture repeated 8 times.
    const roadMat = roadMesh.current?.material as MeshStandardMaterial | undefined;
    if (roadMat?.map) roadMat.map.offset.x = d / (6 / 8);
    if (hText.current) {
      hText.current.textContent = `Ridden ${d.toFixed(1)} m · height gained ${(d * Math.sin(alpha)).toFixed(2)} m`;
    }
  };
  useFrame(() => {
    place();
    if (motion.current.playing) invalidate();
  });
  useEffect(() => {
    place();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, slopePercent, r1, r2, invalidate]);

  // Frame points (bike frame, level; the whole bike is tilted with the road).
  const bb: [number, number, number] = [0.42, Rw - 0.27, 0];
  const seat: [number, number, number] = [0.3, Rw + 0.38, 0];
  const head: [number, number, number] = [0.88, Rw + 0.32, 0];
  const rearHub: [number, number, number] = [0, Rw, 0];
  const frontHub: [number, number, number] = [1.0, Rw, 0];
  const spokes = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 16);
  const seg = r.segments;

  const wheel = (ref: React.RefObject<Group | null>, x: number) => (
    <group ref={ref} position={[x, Rw, 0]}>
      <mesh material={m.rubber}>
        <torusGeometry args={[Rw - 0.016, 0.016, 10, seg * 2]} />
      </mesh>
      <mesh material={m.steel}>
        <torusGeometry args={[Rw - 0.04, 0.008, 6, seg * 2]} />
      </mesh>
      {spokes.map((a) => (
        <mesh key={a} rotation={[0, 0, a]} material={m.steel}>
          <cylinderGeometry args={[0.0012, 0.0012, (Rw - 0.04) * 2, 4]} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 12]} />
      </mesh>
    </group>
  );

  return (
    <>
      <LabStage shadowArea={1.6} lightTarget={[0.5, 0.5, 0]} />
      <Shadowed>
        <group rotation={[0, 0, alpha]}>
          {/* Road */}
          <mesh ref={roadMesh} position={[0.5, -0.05, 0]} material={road}>
            <boxGeometry args={[6, 0.1, 1.2]} />
          </mesh>
          {wheel(rear, 0)}
          {wheel(front, 1.0)}
          {/* Sprocket and chain (drive side, +z) */}
          <group position={[rearHub[0], rearHub[1], 0.045]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={m.darkSteel}>
              <cylinderGeometry args={[r2, r2, 0.004, seg]} />
            </mesh>
          </group>
          <Tube
            a={[0, Rw + r2, 0.045]}
            b={[bb[0], bb[1] + r1, 0.045]}
            radius={0.004}
            material={m.darkSteel}
          />
          <Tube
            a={[0, Rw - r2, 0.045]}
            b={[bb[0], bb[1] - r1, 0.045]}
            radius={0.004}
            material={m.darkSteel}
          />
          {/* Frame */}
          <Tube a={rearHub} b={bb} radius={0.012} material={m.framePaint} />
          <Tube a={rearHub} b={seat} radius={0.01} material={m.framePaint} />
          <Tube a={bb} b={seat} radius={0.016} material={m.framePaint} />
          <Tube a={seat} b={head} radius={0.015} material={m.framePaint} />
          <Tube a={bb} b={head} radius={0.019} material={m.framePaint} />
          <Tube a={head} b={frontHub} radius={0.013} material={m.framePaint} />
          <Tube a={seat} b={[seat[0] - 0.03, seat[1] + 0.1, 0]} radius={0.012} material={m.steel} />
          <RoundedBox
            args={[0.26, 0.05, 0.13]}
            radius={0.02}
            smoothness={2}
            position={[seat[0] - 0.05, seat[1] + 0.13, 0]}
            material={m.rubber}
          />
          <Tube
            a={head}
            b={[head[0] - 0.02, head[1] + 0.12, 0]}
            radius={0.012}
            material={m.steel}
          />
          <mesh
            position={[head[0] - 0.02, head[1] + 0.12, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            material={m.rubber}
          >
            <cylinderGeometry args={[0.013, 0.013, 0.42, 10]} />
          </mesh>
          {/* Chainring with the cranks and pedals (effort) */}
          <group position={bb}>
            <group ref={crank}>
              <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]} material={m.steel}>
                <cylinderGeometry args={[r1, r1, 0.005, seg]} />
              </mesh>
              {[0, Math.PI].map((a, i) => (
                <group key={a} rotation={[0, 0, a]}>
                  <mesh position={[crankM / 2, 0, i === 0 ? 0.06 : -0.06]} material={m.darkSteel}>
                    <boxGeometry args={[crankM, 0.02, 0.012]} />
                  </mesh>
                  <mesh position={[crankM, 0, i === 0 ? 0.11 : -0.11]} material={m.effortPaint}>
                    <boxGeometry args={[0.09, 0.02, 0.1]} />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
          <SceneLabel position={[bb[0] + 0.1, bb[1] - 0.2, 0.2]}>Effort (pedals)</SceneLabel>
          <SceneLabel position={[0.05, Rw + 0.15, 0.22]}>Sprocket (gear)</SceneLabel>
          <SceneLabel
            position={[0.5, Rw + 0.62, 0]}
          >{`Rider + bicycle, ${massKg} kg (load)`}</SceneLabel>
        </group>
        <Html
          position={[0.5, 1.45, 0]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span
            ref={hText}
            aria-hidden="true"
            className="block rounded-sm border border-rule bg-surface/90 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-ink shadow-pop"
          >
            Ridden 0.0 m
          </span>
        </Html>
      </Shadowed>
      <OrbitControls
        makeDefault
        target={[0.5, 0.5, 0]}
        enablePan={false}
        minDistance={0.5}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
