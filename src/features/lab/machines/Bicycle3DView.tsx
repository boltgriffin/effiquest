import { sprocketRadius } from '@/physics-core';
import { BicycleScene } from '@/scene/BicycleScene';
import LabCanvas from '../LabCanvas';
import type { CameraView, View3DProps } from '../shared/types';
import { BICYCLE_FIXED, type BicycleLabParams } from './bicycleParams';

const VIEWS: CameraView[] = [
  { id: 'side', label: 'Side', position: [0.5, 0.75, 2.6], target: [0.5, 0.5, 0] },
  { id: 'angled', label: 'Angled', position: [2.1, 1.2, 1.9], target: [0.5, 0.5, 0] },
  { id: 'drive', label: 'Gears', position: [0.25, 0.4, 0.75], target: [0.25, 0.25, 0] },
];

/** Lazy-loaded 3D view of the bicycle climbing a hill. */
export default function Bicycle3DView({ params, motion, playing }: View3DProps<BicycleLabParams>) {
  return (
    <LabCanvas label={`3D view: bicycle on a ${params.slopePercent} percent hill`} views={VIEWS}>
      <BicycleScene
        slopePercent={params.slopePercent}
        wheelRadiusM={BICYCLE_FIXED.wheelRadiusM}
        crankM={BICYCLE_FIXED.crankM}
        chainringRadiusM={sprocketRadius(params.chainringTeeth, BICYCLE_FIXED.chainPitchM)}
        sprocketRadiusM={sprocketRadius(params.sprocketTeeth, BICYCLE_FIXED.chainPitchM)}
        distanceM={BICYCLE_FIXED.distanceM}
        massKg={params.massKg}
        motion={motion}
        playing={playing}
      />
    </LabCanvas>
  );
}
