import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Matrix4,
  MeshStandardMaterial,
  PointsMaterial,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
} from 'three';
import type { LabId } from '@/content/quests';
import { useRealism } from '@/scene/realism/quality';
import { ShowcaseContext } from '@/scene/realism/showcase';
import { useStudioEnvironment } from '@/scene/realism/studioEnvironment';
import { createMotion } from '../motion';
import {
  loopOffset,
  loopStep,
  nearby,
  nearestAngle,
  placementFor,
  TRACK_RADIUS,
  type Placement,
} from './layout';
import { showcaseModels } from './models';

export interface ModelSize {
  width: number;
  height: number;
  depth: number;
}

export interface Showcase3DProps {
  ids: readonly LabId[];
  selected: number;
  onSelect: (index: number) => void;
  /** Demo motion, camera drift and particles. False with reduced motion or when off screen. */
  animate: boolean;
  /** prefers-reduced-motion: moves are instant. */
  reducedMotion: boolean;
  /** Real size of each lab model (m), once measured. */
  onMeasured?: (id: LabId, size: ModelSize) => void;
  onContextLost?: () => void;
  label: string;
}

/** Colours of the showcase stage (dark platform, teal accent = dark-theme --brand). */
const PLATFORM = '#121a1b';
const PLATFORM_TOP = '#182325';
const ACCENT = '#4fd1c0';
const PLATFORM_RADIUS = 3.45;
/** Largest dimension of a model on the centre stand (scene units). */
const FIT = 1.75;
const STAND_RADIUS = 0.95;
const STAND_HEIGHT = 0.16;
/** Models drawn either side of the selected one (all nine on High quality). */
const NEARBY = 2;

/**
 * The welcome screen's 3D showcase: ONE WebGL canvas holding the labs' own 3D models (the same
 * components the labs use, drawn without their per-lab floor, labels and controls). Each model is
 * scaled as a whole to fit its stand, so its proportions are unchanged. Renders on demand: frames
 * are drawn only while something moves.
 */
export default function Showcase3D({
  onContextLost,
  label,
  animate: animateRequested,
  ...rest
}: Showcase3DProps) {
  const r = useRealism();
  // Low quality: a still picture (it still redraws when the selection changes).
  const animate = animateRequested && r.tier !== 'low';
  const props = { ...rest, animate };
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  return (
    <Canvas
      dpr={r.dpr}
      frameloop="demand"
      shadows={r.shadows ? 'percentage' : false}
      camera={{ fov: 36, position: [0, 2.2, 6.4], near: 0.05, far: 60 }}
      gl={{ alpha: true, antialias: true }}
      role="img"
      aria-label={label}
      onCreated={({ gl }) => {
        const el = gl.domElement;
        const onLost = (event: Event) => {
          event.preventDefault();
          onContextLost?.();
        };
        el.addEventListener('webglcontextlost', onLost);
        cleanup.current = () => el.removeEventListener('webglcontextlost', onLost);
      }}
    >
      <ShowcaseContext.Provider value>
        <ShowcaseStage />
        <Platform selected={props.selected} count={props.ids.length} />
        <Carousel {...props} />
        <CameraRig animate={animate} />
        {animate ? <Particles /> : null}
        <FrameDriver fps={animate ? (r.tier === 'high' ? 60 : 30) : 0} />
      </ShowcaseContext.Provider>
    </Canvas>
  );
}

function ShowcaseStage() {
  const r = useRealism();
  useStudioEnvironment(true);
  return (
    <>
      <hemisphereLight args={['#dcefeb', '#0a1110', r.environment ? 0.4 : 1]} />
      {/* Spotlight on the centre stand (its default target is the origin) */}
      <spotLight
        position={[1.4, 6, 3.4]}
        angle={0.42}
        penumbra={0.75}
        decay={0}
        intensity={r.environment ? 2.6 : 2.2}
        castShadow={r.shadows}
        shadow-mapSize-width={r.shadowMapSize}
        shadow-mapSize-height={r.shadowMapSize}
        shadow-camera-near={2}
        shadow-camera-far={12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* Teal rim light from behind, soft fill from the front left */}
      <directionalLight position={[-2.5, 3.5, -4.5]} intensity={1.1} color={ACCENT} />
      <directionalLight position={[-3.5, 2.5, 3]} intensity={0.45} />
    </>
  );
}

/** A three.js object made once for the component's lifetime and disposed on unmount. */
function useDisposable<T extends { dispose: () => void }>(make: () => T): T {
  const [value] = useState(make);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/** The round platform: base, the track, a turning ring of ticks and the centre glow. */
function Platform({ selected, count }: { selected: number; count: number }) {
  const r = useRealism();
  const invalidate = useThree((s) => s.invalidate);
  const ticks = useRef<Group>(null);
  const turn = useRef({ angle: 0, target: 0, last: selected });
  const base = useDisposable(
    () => new MeshStandardMaterial({ color: PLATFORM, metalness: 0.55, roughness: 0.45 }),
  );
  const top = useDisposable(
    () => new MeshStandardMaterial({ color: PLATFORM_TOP, metalness: 0.35, roughness: 0.6 }),
  );
  const glow = useDisposable(
    () =>
      new MeshStandardMaterial({
        color: ACCENT,
        emissive: ACCENT,
        emissiveIntensity: 1.2,
        toneMapped: false,
      }),
  );
  const dim = useDisposable(
    () =>
      new MeshStandardMaterial({
        color: ACCENT,
        emissive: ACCENT,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.55,
      }),
  );

  // The tick ring turns one place per selection step, the same way as the machines.
  useFrame((_, dtRaw) => {
    const t = turn.current;
    if (t.last !== selected) {
      t.target -= (loopStep(t.last, selected, count) * Math.PI * 2) / 18;
      t.last = selected;
    }
    const k = 1 - Math.exp(-Math.min(dtRaw, 0.1) * 5);
    t.angle += (t.target - t.angle) * k;
    if (ticks.current) ticks.current.rotation.y = t.angle;
    if (Math.abs(t.target - t.angle) > 1e-4) invalidate();
  });

  const seg = r.segments * 3;
  return (
    <group>
      <mesh position={[0, -0.07, 0]} material={base} receiveShadow>
        <cylinderGeometry args={[PLATFORM_RADIUS, PLATFORM_RADIUS + 0.15, 0.14, seg]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} material={top} receiveShadow>
        <circleGeometry args={[PLATFORM_RADIUS - 0.08, seg]} />
      </mesh>
      {/* The track the machines travel on */}
      {[TRACK_RADIUS - 0.5, TRACK_RADIUS + 0.5].map((radius) => (
        <mesh key={radius} rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} material={dim}>
          <ringGeometry args={[radius - 0.012, radius + 0.012, seg * 2]} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} material={glow}>
        <ringGeometry args={[PLATFORM_RADIUS - 0.1, PLATFORM_RADIUS - 0.08, seg * 2]} />
      </mesh>
      <group ref={ticks}>
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          const rr = TRACK_RADIUS + 0.72;
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * rr, 0.006, Math.cos(a) * rr]}
              rotation-y={a}
              material={dim}
            >
              <boxGeometry args={[0.02, 0.004, 0.14]} />
            </mesh>
          );
        })}
      </group>
      {/* Glowing ring round the centre stand */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]} material={glow}>
        <ringGeometry args={[STAND_RADIUS + 0.08, STAND_RADIUS + 0.105, seg * 2]} />
      </mesh>
    </group>
  );
}

type Animated = Placement;

function Carousel({
  ids,
  selected,
  onSelect,
  animate,
  reducedMotion,
  onMeasured,
}: Omit<Showcase3DProps, 'label' | 'onContextLost'>) {
  const count = ids.length;
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const groups = useRef<Array<Group | null>>([]);
  const current = useRef<Animated[]>(
    ids.map((_, i) => placementFor(loopOffset(i, selected, count), count)),
  );
  const motions = useMemo(() => ids.map(() => ({ current: createMotion(0) })), [ids]);
  const demo = useRef({ time: 0, last: selected });

  // The selected model is built at once; its neighbours follow one at a time (each first build
  // compiles shaders, so spreading them out keeps the page responsive). Built models are kept,
  // so browsing back is instant.
  const [built, setBuilt] = useState(() => new Set([selected]));
  if (!built.has(selected)) setBuilt(new Set([...built, selected]));
  const pending = nearby(selected, count, NEARBY).find((i) => !built.has(i));
  useEffect(() => {
    if (pending === undefined) return;
    const id = window.setTimeout(() => setBuilt((prev) => new Set([...prev, pending])), 150);
    return () => window.clearTimeout(id);
  }, [pending]);

  useEffect(() => {
    invalidate();
  }, [selected, animate, invalidate]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
    let moving = false;
    ids.forEach((_, i) => {
      const target = placementFor(loopOffset(i, selected, count), count);
      const c = current.current[i];
      if (!c) return;
      const angle = nearestAngle(c.angle, target.angle);
      c.angle += (angle - c.angle) * k;
      c.radius += (target.radius - c.radius) * k;
      c.scale += (target.scale - c.scale) * k;
      c.lift += (target.lift - c.lift) * k;
      if (
        Math.abs(angle - c.angle) > 1e-3 ||
        Math.abs(target.radius - c.radius) > 1e-3 ||
        Math.abs(target.scale - c.scale) > 1e-3
      ) {
        moving = true;
      }
      const g = groups.current[i];
      if (g) {
        g.position.set(Math.sin(c.angle) * c.radius, c.lift, Math.cos(c.angle) * c.radius);
        // Machines on the track turn a little towards the centre; the centre one faces the camera.
        g.rotation.y = c.angle * 0.3 * (c.radius / TRACK_RADIUS);
        g.scale.setScalar(c.scale);
      }
    });

    // The selected machine runs its own lab motion (there and back) as a demonstration.
    const d = demo.current;
    if (d.last !== selected) {
      d.time = 0;
      d.last = selected;
    }
    motions.forEach(({ current: m }, i) => {
      if (i === selected && animate) {
        d.time += dt;
        const cycle = 8;
        const p = (d.time % cycle) / cycle;
        const tri = p < 0.5 ? p * 2 : 2 - p * 2;
        const x = Math.min(1, Math.max(0, (tri - 0.08) / 0.84));
        m.fraction = x * x * (3 - 2 * x);
        // Not "playing": the scene would then ask for every frame; FrameDriver sets the pace.
        m.playing = false;
      } else {
        m.playing = false;
        if (i !== selected || reducedMotion) m.fraction = 0;
      }
    });

    if (moving) invalidate();
  });

  const r = useRealism();
  const drawn = (i: number) =>
    r.tier === 'high' || Math.abs(loopOffset(i, selected, count)) <= NEARBY;

  const pick = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    if (i === selected || e.delta > 8) return; // a drag or swipe, not a tap
    e.stopPropagation();
    onSelect(i);
  };
  const hover = (i: number, on: boolean) => () => {
    gl.domElement.style.cursor = on && i !== selected ? 'pointer' : '';
  };

  return (
    <>
      {ids.map((id, i) => {
        const render = showcaseModels[id];
        const motion = motions[i];
        return (
          <group
            key={id}
            ref={(el) => {
              groups.current[i] = el;
            }}
          >
            <Stand />
            {/* Invisible tap target covering the stand and the model */}
            <mesh
              position={[0, 1, 0]}
              onClick={pick(i)}
              onPointerOver={hover(i, true)}
              onPointerOut={hover(i, false)}
            >
              <cylinderGeometry args={[STAND_RADIUS, STAND_RADIUS, 2, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
            </mesh>
            {built.has(i) && motion ? (
              <FitModel id={id} onMeasured={onMeasured} hidden={!drawn(i)}>
                {render(motion, false)}
              </FitModel>
            ) : null}
          </group>
        );
      })}
    </>
  );
}

function Stand() {
  const r = useRealism();
  const mat = useDisposable(
    () => new MeshStandardMaterial({ color: PLATFORM_TOP, metalness: 0.6, roughness: 0.35 }),
  );
  return (
    <mesh position={[0, -STAND_HEIGHT / 2, 0]} material={mat} castShadow receiveShadow>
      <cylinderGeometry args={[STAND_RADIUS, STAND_RADIUS + 0.04, STAND_HEIGHT, r.segments * 2]} />
    </mesh>
  );
}

const tmpBox = new Box3();
const tmpMatrix = new Matrix4();

/**
 * Bounds of everything drawn inside `root`, in root's own coordinates. Instanced meshes (the
 * ropes, drawn as many short cylinders) are left out: their geometry is one unit cylinder and a
 * rope always runs between parts of the machine.
 */
function localBounds(root: Group): Box3 {
  root.updateWorldMatrix(true, true);
  const inverse = new Matrix4().copy(root.matrixWorld).invert();
  const box = new Box3();
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh || !mesh.geometry || (mesh as InstancedMesh).isInstancedMesh) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const b = mesh.geometry.boundingBox;
    if (!b || b.isEmpty()) return;
    tmpBox.copy(b).applyMatrix4(tmpMatrix.multiplyMatrices(inverse, mesh.matrixWorld));
    box.union(tmpBox);
  });
  return box;
}

/**
 * Scales a lab model as a whole (proportions unchanged) so its largest dimension is FIT, and stands
 * it on the stand top. Measured on the first frame after it is built (ropes and loads placed).
 */
function FitModel({
  id,
  children,
  onMeasured,
  hidden = false,
}: {
  id: LabId;
  children: ReactNode;
  onMeasured?: (id: LabId, size: ModelSize) => void;
  /** Kept built but not drawn (far round the track). */
  hidden?: boolean;
}) {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const measured = useRef(false);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [invalidate]);

  useFrame(() => {
    if (measured.current || !outer.current || !inner.current) return;
    const box = localBounds(inner.current);
    if (box.isEmpty()) return;
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const s = FIT / Math.max(size.x, size.y, size.z, 1e-3);
    outer.current.scale.setScalar(s);
    outer.current.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
    outer.current.visible = !hidden;
    measured.current = true;
    onMeasured?.(id, { width: size.x, height: size.y, depth: size.z });
    invalidate();
  });

  useEffect(() => {
    if (outer.current && measured.current) outer.current.visible = !hidden;
    invalidate();
  }, [hidden, invalidate]);

  return (
    <group ref={outer} visible={false}>
      <group ref={inner}>{children}</group>
    </group>
  );
}

/** Camera: frames the platform for the viewport shape, with a slow drift while animating. */
function CameraRig({ animate }: { animate: boolean }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const time = useRef(0);
  useFrame((_, dt) => {
    const aspect = size.width / Math.max(size.height, 1);
    const tanHalf = Math.tan((36 * Math.PI) / 360);
    // Keep the centre model large; on narrow screens the side places are partly cropped.
    const halfWidth = aspect < 1 ? 1.45 : 2.9;
    const dist = Math.max(5, halfWidth / (tanHalf * aspect));
    if (animate) time.current += Math.min(dt, 0.1);
    const sway = animate ? Math.sin(time.current * 0.22) * 0.1 : 0;
    const elevation = 0.3;
    const flat = Math.cos(elevation) * dist;
    camera.position.set(
      Math.sin(sway) * flat,
      0.9 + Math.sin(elevation) * dist,
      Math.cos(sway) * flat,
    );
    camera.lookAt(0, 0.95, 0);
  });
  return null;
}

/**
 * Paces continuous animation (demo motion, drift, particles) at a capped frame rate instead of
 * every display frame, to spare phones and laptops on battery. 0 = no continuous frames.
 */
function FrameDriver({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (fps <= 0) return;
    const id = window.setInterval(() => invalidate(), 1000 / fps);
    return () => window.clearInterval(id);
  }, [fps, invalidate]);
  return null;
}

/** A few slow, faint motes of light above the platform (not on Low quality). */
function Particles() {
  const group = useRef<Group>(null);
  const geometry = useDisposable(() => {
    const n = 90;
    const positions = new Float32Array(n * 3);
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < n; i += 1) {
      const a = rand() * Math.PI * 2;
      const rr = 1.2 + rand() * 3;
      positions.set([Math.sin(a) * rr, 0.3 + rand() * 3, Math.cos(a) * rr], i * 3);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    return g;
  });
  const material = useDisposable(
    () =>
      new PointsMaterial({
        color: ACCENT,
        size: 0.03,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
  );
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += Math.min(dt, 0.1) * 0.03;
  });
  return (
    <group ref={group}>
      <points geometry={geometry} material={material} />
    </group>
  );
}
