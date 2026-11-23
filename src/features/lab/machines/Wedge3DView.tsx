import { WedgeScene } from '@/scene/WedgeScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { WEDGE_PUSH_M, type WedgeLabParams } from './wedgeParams';

const VIEWS: CameraView[] = [
  { id: 'side', label: 'Side', position: [0, 0.25, 2.0], target: [0, 0.15, 0] },
  { id: 'angled', label: 'Angled', position: [1.3, 0.9, 1.5], target: [0, 0.15, 0] },
  { id: 'faces', label: 'Faces', position: [0.5, 0.25, 0.9], target: [0.1, 0.1, 0] },
];

/** Lazy-loaded 3D view of the lifting wedge. */
export default function Wedge3DView({ params, motion, playing }: View3DProps<WedgeLabParams>) {
  return (
    <LabCanvas label="3D view: lifting wedge" views={VIEWS}>
      <WedgeScene
        wedgeAngleDeg={params.wedgeAngleDeg}
        pushM={WEDGE_PUSH_M}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
