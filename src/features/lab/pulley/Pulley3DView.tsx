import { PulleyScene } from '@/scene/PulleyScene';
import LabCanvas from '../LabCanvas';
import type { MotionRef } from '../motion';
import type { CameraView } from '../shared/types';
import { PULLEY_GEOMETRY, type PulleyLabParams } from './params';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0.3, 1.7, 4.4], target: [0, 1.5, 0] },
  { id: 'angled', label: 'Angled', position: [2.6, 2.2, 3.2], target: [0, 1.5, 0] },
  { id: 'close', label: 'Pulleys', position: [0.2, 2.6, 1.3], target: [0, 2.4, 0] },
];

/** The Pulley scene drawn from lab settings; shared by the lab and the welcome showcase. */
export function PulleyModel({
  params,
  motion,
  playing,
}: {
  params: PulleyLabParams;
  motion: MotionRef;
  playing: boolean;
}) {
  return (
    <PulleyScene
      segments={params.segments}
      loadMassKg={params.loadMassKg}
      liftM={PULLEY_GEOMETRY.liftM}
      motion={motion}
      playing={playing}
    />
  );
}

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
      views={VIEWS}
    >
      <PulleyModel params={params} motion={motion} playing={playing} />
    </LabCanvas>
  );
}
