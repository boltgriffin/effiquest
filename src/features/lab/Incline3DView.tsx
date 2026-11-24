import { InclineScene } from '@/scene/InclineScene';
import LabCanvas from './LabCanvas';
import type { MotionRef } from './motion';
import { RAMP_LENGTH_M, type InclineParams } from './params';
import type { CameraView } from './shared/types';

const VIEWS: CameraView[] = [
  { id: 'angled', label: 'Angled', position: [0.9, 1.3, 2.6], target: [0, 0.5, 0] },
  { id: 'side', label: 'Side', position: [0, 0.6, 3.2], target: [0, 0.6, 0] },
  { id: 'top', label: 'Above', position: [0.01, 3.4, 0.6], target: [0, 0.3, 0] },
];

/** The Incline scene drawn from lab settings; shared by the lab and the welcome showcase. */
export function InclineModel({
  params,
  motion,
  playing,
}: {
  params: InclineParams;
  motion: MotionRef;
  playing: boolean;
}) {
  return (
    <InclineScene
      angleDeg={params.angleDeg}
      lengthM={RAMP_LENGTH_M}
      massKg={params.massKg}
      motion={motion}
      playing={playing}
    />
  );
}

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
    <LabCanvas label={`3D view: ramp at ${params.angleDeg} degrees`} views={VIEWS}>
      <InclineModel params={params} motion={motion} playing={playing} />
    </LabCanvas>
  );
}
