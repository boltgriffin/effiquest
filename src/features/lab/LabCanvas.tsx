import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { ErrorState } from '@/components/StatePanels';
import { useUiStore, type QualityTier } from '@/store/uiStore';

const DPR: Record<QualityTier, [number, number]> = {
  low: [1, 1],
  auto: [1, 1.5],
  high: [1, 2],
};

/** WebGL canvas with quality tiers and recovery from a lost graphics context. */
export default function LabCanvas({
  children,
  label = '3D laboratory view',
  cameraPosition = [3, 2.5, 4],
}: {
  children: ReactNode;
  label?: string;
  /** Initial camera position (m), chosen per machine so the apparatus fills the view. */
  cameraPosition?: [number, number, number];
}) {
  const quality = useUiStore((s) => s.quality);
  const [contextLost, setContextLost] = useState(false);
  const [generation, setGeneration] = useState(0);
  const cleanup = useRef<(() => void) | null>(null);

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
    <Canvas
      key={generation}
      dpr={DPR[quality]}
      frameloop="demand"
      camera={{ position: cameraPosition, fov: 45 }}
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
    </Canvas>
  );
}
