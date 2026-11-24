import { Html } from '@react-three/drei';
import { useShowcase } from './realism/showcase';

/**
 * A text label pinned to a point in a 3D scene (DOM overlay: readable at any zoom, no font
 * download, works offline). Decorative for screen readers; the diagram tab and readouts carry
 * the same information as text.
 */
export function SceneLabel({
  position,
  children,
}: {
  position: [number, number, number];
  children: string;
}) {
  // The welcome showcase names the machine in its own panel; labels would crowd the platform.
  if (useShowcase()) return null;
  return (
    <Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <span
        aria-hidden="true"
        className="block rounded-sm border border-rule bg-surface/90 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-ink shadow-pop"
      >
        {children}
      </span>
    </Html>
  );
}
