import { LeverScene } from '@/scene/LeverScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { LEVER_ROTATION_DEG, type LeverLabParams } from './leverParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0, 0.8, 2.4], target: [0, 0.5, 0] },
  { id: 'angled', label: 'Angled', position: [1.6, 1.3, 1.8], target: [0, 0.5, 0] },
  { id: 'fulcrum', label: 'Fulcrum', position: [0.2, 0.7, 1.1], target: [0, 0.55, 0] },
];

/** Lazy-loaded 3D view of the lever. */
export default function Lever3DView({ params, motion, playing }: View3DProps<LeverLabParams>) {
  return (
    <LabCanvas label="3D view: first-class lever on a fulcrum" views={VIEWS}>
      <LeverScene
        effortArmM={params.effortArmM}
        loadArmM={params.loadArmM}
        rotationDeg={LEVER_ROTATION_DEG}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
