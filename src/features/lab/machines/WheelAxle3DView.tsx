import { WheelAxleScene } from '@/scene/WheelAxleScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { WHEEL_AXLE_FIXED, type WheelAxleLabParams } from './wheelAxleParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0.2, 1.1, 3.2], target: [0, 0.9, 0] },
  { id: 'angled', label: 'Angled', position: [2.2, 1.6, 2.4], target: [0, 0.9, 0] },
  { id: 'axle', label: 'Axle', position: [0.6, 1.4, 1.2], target: [0, 1.3, 0] },
];

/** Lazy-loaded 3D view of the wheel and axle. */
export default function WheelAxle3DView({
  params,
  motion,
  playing,
}: View3DProps<WheelAxleLabParams>) {
  return (
    <LabCanvas label="3D view: wheel and axle winch" views={VIEWS}>
      <WheelAxleScene
        wheelRadiusM={params.wheelRadiusM}
        axleRadiusM={params.axleRadiusM}
        liftM={WHEEL_AXLE_FIXED.liftM}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
