import type { ComponentType, ReactNode } from 'react';
import type { LabId } from '@/content/quests';
import { InclineModel } from '../Incline3DView';
import { bicycleLab } from '../machines/bicycle';
import { BicycleModel } from '../machines/Bicycle3DView';
import { brakeLab } from '../machines/brake';
import { BrakeModel } from '../machines/Brake3DView';
import { hydraulicLab } from '../machines/hydraulic';
import { HydraulicModel } from '../machines/Hydraulic3DView';
import { inclineLab } from '../machines/incline';
import { leverLab } from '../machines/lever';
import { LeverModel } from '../machines/Lever3DView';
import { pulleyLab } from '../machines/pulley';
import { screwLab } from '../machines/screw';
import { ScrewModel } from '../machines/Screw3DView';
import { wedgeLab } from '../machines/wedge';
import { WedgeModel } from '../machines/Wedge3DView';
import { wheelAxleLab } from '../machines/wheelAxle';
import { WheelAxleModel } from '../machines/WheelAxle3DView';
import type { MotionRef } from '../motion';
import { PulleyModel } from '../pulley/Pulley3DView';
import type { LabParams, MachineDefinition, View3DProps } from '../shared/types';

/** Draws one lab's own 3D model (the same component the lab uses) at the lab's default settings. */
export type ModelRenderer = (motion: MotionRef, playing: boolean) => ReactNode;

function model<P extends LabParams>(
  def: MachineDefinition<P>,
  Model: ComponentType<View3DProps<P>>,
): ModelRenderer {
  const ModelAtDefaults = (motion: MotionRef, playing: boolean) => (
    <Model params={def.defaults} motion={motion} playing={playing} />
  );
  return ModelAtDefaults;
}

export const showcaseModels: Record<LabId, ModelRenderer> = {
  lever: model(leverLab, LeverModel),
  incline: model(inclineLab, InclineModel),
  pulley: model(pulleyLab, PulleyModel),
  wheel_axle: model(wheelAxleLab, WheelAxleModel),
  hydraulic: model(hydraulicLab, HydraulicModel),
  screw: model(screwLab, ScrewModel),
  wedge: model(wedgeLab, WedgeModel),
  bicycle: model(bicycleLab, BicycleModel),
  brake: model(brakeLab, BrakeModel),
};
