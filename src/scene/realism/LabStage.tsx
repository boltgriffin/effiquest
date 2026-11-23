import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator, type Group, type Mesh } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useLabMaterials } from './materials';
import { useRealism } from './quality';

/**
 * The lab setting shared by every 3D scene: studio reflections (generated, no download), a key
 * light with soft shadows, fill light and a concrete floor. On "Low" quality it falls back to
 * plain lighting with no shadows or reflections.
 */
export function LabStage({
  floorRadius = 3,
  shadowArea = 1.5,
  lightTarget = [0, 0.5, 0],
}: {
  floorRadius?: number;
  /** Half-size (m) of the region that casts and receives shadows. */
  shadowArea?: number;
  lightTarget?: [number, number, number];
}) {
  const r = useRealism();
  const m = useLabMaterials();
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  // The renderer and scene are three.js objects owned by the canvas; they are read from the
  // store inside effects (not captured from a hook) and configured there.
  useEffect(() => {
    const { gl, scene } = get();
    gl.shadowMap.enabled = r.shadows;
    if (!r.environment) {
      scene.environment = null;
      invalidate();
      return;
    }
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.6;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      room.dispose?.();
    };
  }, [r.environment, r.shadows, get, invalidate]);

  const [tx, ty, tz] = lightTarget;
  return (
    <>
      <hemisphereLight args={['#f4f1ea', '#6b675f', r.environment ? 0.55 : 1.1]} />
      <directionalLight
        position={[tx + 2.2, ty + 4, tz + 2.6]}
        intensity={r.environment ? 1.8 : 1.4}
        castShadow={r.shadows}
        shadow-mapSize-width={r.shadowMapSize}
        shadow-mapSize-height={r.shadowMapSize}
        shadow-camera-left={-shadowArea}
        shadow-camera-right={shadowArea}
        shadow-camera-top={shadowArea}
        shadow-camera-bottom={-shadowArea}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[tx - 3, ty + 2, tz - 2]} intensity={0.35} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
        material={m.floor}
      >
        <circleGeometry args={[floorRadius, r.segments * 2]} />
      </mesh>
    </>
  );
}

/** Makes every mesh inside cast and receive shadows (re-applied when its contents change). */
export function Shadowed({ children }: { children: ReactNode }) {
  const g = useRef<Group>(null);
  const r = useRealism();
  useLayoutEffect(() => {
    g.current?.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = r.shadows;
        mesh.receiveShadow = r.shadows;
      }
    });
  });
  return <group ref={g}>{children}</group>;
}
