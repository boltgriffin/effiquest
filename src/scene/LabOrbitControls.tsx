import { OrbitControls } from '@react-three/drei';
import type { ComponentProps } from 'react';
import { useShowcase } from './realism/showcase';

/** The lab's drag-to-turn camera controls; left out on the welcome showcase, which moves its own camera. */
export function LabOrbitControls(props: ComponentProps<typeof OrbitControls>) {
  return useShowcase() ? null : <OrbitControls {...props} />;
}
