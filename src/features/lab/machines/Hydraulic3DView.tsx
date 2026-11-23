import { HydraulicScene } from '@/scene/HydraulicScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import type { HydraulicLabParams } from './hydraulicParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0, 0.8, 2.4], target: [0, 0.5, 0] },
  { id: 'angled', label: 'Angled', position: [1.6, 1.4, 1.8], target: [0, 0.5, 0] },
  { id: 'pistons', label: 'Pistons', position: [0.1, 1.6, 1.0], target: [0, 0.6, 0] },
];

/** Lazy-loaded 3D view of the hydraulic press. */
export default function Hydraulic3DView({
  params,
  motion,
  playing,
}: View3DProps<HydraulicLabParams>) {
  return (
    <LabCanvas label="3D view: hydraulic press (movements not to scale)" views={VIEWS}>
      <HydraulicScene
        inputDiameterM={params.inputDiameterM}
        outputDiameterM={params.outputDiameterM}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
