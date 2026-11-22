import { PulleyScene } from '@/scene/PulleyScene';
import LabCanvas from '../LabCanvas';
import type { MotionRef } from '../motion';
import type { PulleyLabParams } from './params';

/** Lazy-loaded 3D view of the pulley system. */
export default function Pulley3DView({
  params,
  motion,
  playing,
}: {
  params: PulleyLabParams;
  motion: MotionRef;
  playing: boolean;
}) {
  return (
    <LabCanvas
      label={`3D view: pulley system with ${params.segments} supporting rope segments`}
      cameraPosition={[0.8, 2.1, 5.8]}
    >
      <PulleyScene segments={params.segments} motion={motion} playing={playing} />
    </LabCanvas>
  );
}
