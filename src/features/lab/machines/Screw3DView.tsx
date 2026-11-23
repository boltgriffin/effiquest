import { ScrewScene } from '@/scene/ScrewScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { SCREW_FIXED, type ScrewLabParams } from './screwParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0, 0.9, 2.2], target: [0, 0.6, 0] },
  { id: 'angled', label: 'Angled', position: [1.4, 1.4, 1.6], target: [0, 0.6, 0] },
  { id: 'thread', label: 'Thread', position: [0.45, 0.55, 0.6], target: [0, 0.45, 0] },
];

/** Lazy-loaded 3D view of the screw jack. */
export default function Screw3DView({ params, motion, playing }: View3DProps<ScrewLabParams>) {
  return (
    <LabCanvas label="3D view: screw jack (rise drawn 5 times larger)" views={VIEWS}>
      <ScrewScene
        handleRadiusM={params.handleRadiusM}
        pitchMm={params.pitchMm}
        liftM={SCREW_FIXED.liftM}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
