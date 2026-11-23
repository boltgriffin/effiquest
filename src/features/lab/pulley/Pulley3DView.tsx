import { PulleyScene } from '@/scene/PulleyScene';
import LabCanvas from '../LabCanvas';
import type { MotionRef } from '../motion';
import type { CameraView } from '../shared/types';
import type { PulleyLabParams } from './params';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0.8, 2.1, 5.8], target: [0.2, 1.6, 0] },
  { id: 'angled', label: 'Angled', position: [3.6, 2.6, 4.2], target: [0.2, 1.6, 0] },
  { id: 'close', label: 'Pulleys', position: [0.4, 2.8, 2.6], target: [0.2, 2.3, 0] },
];

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
      <PulleyScene segments={params.segments} motion={motion} playing={playing} />
    </LabCanvas>
  );
}
