import { InclineScene } from '@/scene/InclineScene';
import LabCanvas from './LabCanvas';
import type { MotionRef } from './motion';
import { RAMP_LENGTH_M, type InclineParams } from './params';

/** Lazy-loaded 3D view of the inclined plane (Three.js stays out of the main bundle). */
export default function Incline3DView({
  params,
  motion,
  playing,
}: {
  params: InclineParams;
  motion: MotionRef;
  playing: boolean;
}) {
  return (
    <LabCanvas
      label={`3D view: ramp at ${params.angleDeg} degrees`}
      cameraPosition={[0.9, 1.3, 2.6]}
    >
      <InclineScene
        angleDeg={params.angleDeg}
        lengthM={RAMP_LENGTH_M}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
