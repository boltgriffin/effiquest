import { BrakeScene } from '@/scene/BrakeScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { BRAKE_FIXED, type BrakeLabParams } from './brakeParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0, 0.6, 2.2], target: [0, 0.45, 0] },
  { id: 'angled', label: 'Angled', position: [1.4, 1.0, 1.6], target: [0, 0.45, 0] },
  { id: 'pedal', label: 'Pedal', position: [-0.4, 0.75, 0.7], target: [-0.65, 0.65, 0] },
  { id: 'caliper', label: 'Caliper', position: [0.75, 0.55, 0.45], target: [0.55, 0.4, -0.07] },
];

/** Lazy-loaded 3D view of the hydraulic brake. */
export default function Brake3DView({ params, motion, playing }: View3DProps<BrakeLabParams>) {
  const areaRatio = (params.caliperDiameterMm / params.masterDiameterMm) ** 2;
  return (
    <LabCanvas label="3D view: hydraulic brake from pedal to wheel" views={VIEWS}>
      <BrakeScene
        pedalRatio={params.pedalRatio}
        masterDiameterM={params.masterDiameterMm / 1000}
        caliperDiameterM={params.caliperDiameterMm / 1000}
        pedalArmM={BRAKE_FIXED.pedalArmM}
        pedalTravelM={BRAKE_FIXED.padTravelM * areaRatio * params.pedalRatio}
        discRadiusM={BRAKE_FIXED.discRadiusM}
        wheelRadiusM={BRAKE_FIXED.wheelRadiusM}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
