import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ErrorState } from '@/components/StatePanels';
import { useUiStore, type QualityTier } from '@/store/uiStore';
import { cx } from '@/utils/cx';
import type { CameraView } from './shared/types';

const DPR: Record<QualityTier, [number, number]> = {
  low: [1, 1],
  auto: [1, 1.5],
  high: [1, 2],
};

type Controls = { target: { set: (x: number, y: number, z: number) => void }; update: () => void };

/** Moves the camera (and the default orbit controls' target) to a preset view. */
function CameraRig({ view, version }: { view: CameraView; version: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.position.set(...view.position);
    if (controls && 'target' in controls) {
      controls.target.set(...view.target);
      controls.update();
    } else {
      camera.lookAt(...view.target);
    }
    invalidate();
    // Re-apply on every button press (version), even if the same view is chosen again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, controls]);
  return null;
}

interface LabCanvasProps {
  children: ReactNode;
  label?: string;
  /** Camera presets; the first is the starting view. Drag to orbit, pinch or scroll to zoom. */
  views: CameraView[];
}

/**
 * WebGL canvas with quality tiers, preset camera views, and recovery from a lost graphics
 * context. Renders on demand to save battery on low-end devices.
 */
export default function LabCanvas({
  children,
  label = '3D laboratory view',
  views,
}: LabCanvasProps) {
  const quality = useUiStore((s) => s.quality);
  const [contextLost, setContextLost] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [version, setVersion] = useState(0);
  const cleanup = useRef<(() => void) | null>(null);
  const view = views[viewIndex] ?? views[0];

  useEffect(() => () => cleanup.current?.(), []);

  if (contextLost) {
    return (
      <ErrorState
        title="The 3D view stopped"
        message="Your device ran out of graphics resources."
        onRetry={() => {
          setContextLost(false);
          setGeneration((g) => g + 1);
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 touch-none">
        <Canvas
          key={generation}
          dpr={DPR[quality]}
          frameloop="demand"
          camera={{ position: views[0]?.position ?? [3, 2.5, 4], fov: 45 }}
          aria-label={label}
          onCreated={({ gl }) => {
            const el = gl.domElement;
            const onLost = (event: Event) => {
              event.preventDefault();
              setContextLost(true);
            };
            el.addEventListener('webglcontextlost', onLost);
            cleanup.current = () => el.removeEventListener('webglcontextlost', onLost);
          }}
        >
          {children}
          {view ? <CameraRig view={view} version={version} /> : null}
        </Canvas>
      </div>
      <div
        role="group"
        aria-label="Camera views"
        className="flex flex-wrap items-center gap-1 border-t border-rule bg-surface px-2 py-1.5"
      >
        <span className="px-1 text-xs text-muted">View:</span>
        {views.map((v, i) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={i === viewIndex}
            onClick={() => {
              setViewIndex(i);
              setVersion((n) => n + 1);
            }}
            className={cx(
              'min-h-9 rounded-md px-3 text-sm',
              i === viewIndex
                ? 'bg-brand-soft font-medium text-ink'
                : 'text-muted hover:bg-surface-2',
            )}
          >
            {v.label}
          </button>
        ))}
        <span className="ml-auto hidden px-1 text-xs text-muted sm:inline">
          Drag to turn · pinch or scroll to zoom
        </span>
      </div>
    </div>
  );
}
