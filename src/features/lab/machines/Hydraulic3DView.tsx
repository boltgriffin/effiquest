import { HydraulicScene } from '@/scene/HydraulicScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { HYDRAULIC_LIFT_M, type HydraulicLabParams } from './hydraulicParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0, 0.45, 1.3], target: [0, 0.3, 0] },
  { id: 'angled', label: 'Angled', position: [0.9, 0.8, 1.0], target: [0, 0.3, 0] },
  { id: 'pistons', label: 'Pistons', position: [0.05, 0.75, 0.45], target: [0, 0.3, 0] },
];

/** Lazy-loaded 3D view of the hydraulic press. */
export default function Hydraulic3DView({
  params,
  motion,
  playing,
}: View3DProps<HydraulicLabParams>) {
  return (
    <LabCanvas label="3D view: hydraulic press at true size, pumped in 10 cm strokes" views={VIEWS}>
      <HydraulicScene
        inputDiameterM={params.inputDiameterM}
        outputDiameterM={params.outputDiameterM}
        loadMassKg={params.loadMassKg}
        liftM={HYDRAULIC_LIFT_M}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
