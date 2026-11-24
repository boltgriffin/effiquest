import { LeverScene } from '@/scene/LeverScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { LEVER_PIN_RADIUS_M, LEVER_ROTATION_DEG, type LeverLabParams } from './leverParams';

const VIEWS: CameraView[] = [
  { id: 'front', label: 'Front', position: [0, 0.8, 2.4], target: [0, 0.5, 0] },
  { id: 'angled', label: 'Angled', position: [1.6, 1.3, 1.8], target: [0, 0.5, 0] },
  { id: 'fulcrum', label: 'Fulcrum', position: [0.2, 0.7, 1.1], target: [0, 0.55, 0] },
];

/** The Lever scene drawn from lab settings; shared by the lab and the welcome showcase. */
export function LeverModel({ params, motion, playing }: View3DProps<LeverLabParams>) {
  return (
    <LeverScene
      effortArmM={params.effortArmM}
      loadArmM={params.loadArmM}
      rotationDeg={LEVER_ROTATION_DEG}
      loadMassKg={params.loadMassKg}
      pinRadiusM={LEVER_PIN_RADIUS_M}
      motion={motion}
      playing={playing}
    />
  );
}

/** Lazy-loaded 3D view of the lever. */
export default function Lever3DView({ params, motion, playing }: View3DProps<LeverLabParams>) {
  return (
    <LabCanvas label="3D view: first-class lever on a fulcrum" views={VIEWS}>
      <LeverModel params={params} motion={motion} playing={playing} />
    </LabCanvas>
  );
}
