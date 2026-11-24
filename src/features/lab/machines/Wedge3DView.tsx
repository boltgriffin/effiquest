import { WedgeScene } from '@/scene/WedgeScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { WEDGE_PUSH_M, type WedgeLabParams } from './wedgeParams';

const VIEWS: CameraView[] = [
  { id: 'side', label: 'Side', position: [0, 0.2, 1.3], target: [0, 0.12, 0] },
  { id: 'angled', label: 'Angled', position: [0.9, 0.6, 1.0], target: [0, 0.12, 0] },
  { id: 'faces', label: 'Faces', position: [0.35, 0.15, 0.55], target: [0.05, 0.06, 0] },
];

/** The Wedge scene drawn from lab settings; shared by the lab and the welcome showcase. */
export function WedgeModel({ params, motion, playing }: View3DProps<WedgeLabParams>) {
  return (
    <WedgeScene
      wedgeAngleDeg={params.wedgeAngleDeg}
      pushM={WEDGE_PUSH_M}
      loadMassKg={params.loadMassKg}
      motion={motion}
      playing={playing}
    />
  );
}

/** Lazy-loaded 3D view of the lifting wedge. */
export default function Wedge3DView({ params, motion, playing }: View3DProps<WedgeLabParams>) {
  return (
    <LabCanvas label="3D view: lifting wedge at true size" views={VIEWS}>
      <WedgeModel params={params} motion={motion} playing={playing} />
    </LabCanvas>
  );
}
