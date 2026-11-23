import { ScrewScene } from '@/scene/ScrewScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { SCREW_FIXED, type ScrewLabParams } from './screwParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0.45, 0.4, 1.35], target: [0, 0.22, 0] },
  { id: 'angled', label: 'Angled', position: [1.0, 0.9, 1.1], target: [0, 0.3, 0] },
  { id: 'thread', label: 'Thread', position: [0.12, 0.22, 0.22], target: [0, 0.2, 0] },
];

/** Lazy-loaded 3D view of the screw jack. */
export default function Screw3DView({ params, motion, playing }: View3DProps<ScrewLabParams>) {
  return (
    <LabCanvas label="3D view: screw jack at true size" views={VIEWS}>
      <ScrewScene
        handleRadiusM={params.handleRadiusM}
        pitchMm={params.pitchMm}
        threadRadiusM={SCREW_FIXED.threadRadiusM}
        loadMassKg={params.loadMassKg}
        liftM={SCREW_FIXED.liftM}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
