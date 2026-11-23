import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { IconName } from '@/components/icons/Icon';
import type { Equation } from '@/content/modules';
import type { LabId } from '@/content/quests';
import type { MachineRun, Validation } from '@/physics-core';
import type { MachineId } from '@/types';
import type { MotionRef } from '../motion';

/** Lab parameters are plain numbers (SI units), so they can be stored with trials. */
export type LabParams = Record<string, number>;

export type VariableSpec<P extends LabParams> =
  | {
      kind: 'slider';
      key: keyof P & string;
      label: string;
      /** Plain-text name for the spoken value. */
      name: string;
      symbol?: ReactNode;
      min: number;
      max: number;
      step: number;
      digits?: number;
      unit?: string;
      hint?: (p: P) => string | undefined;
    }
  | {
      kind: 'segmented';
      key: keyof P & string;
      legend: string;
      options: ReadonlyArray<{ value: number; label: string }>;
      describe?: (p: P) => string;
    };

export interface KnowledgeItem {
  id: string;
  question: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  correctId: string;
  /** Shown after answering, whether right or wrong. */
  explanation: string;
}

export interface GuideContent {
  objective: string;
  sourceNote: string;
  /** What the machine is for and how it behaves, in Grade 11 language. */
  purpose: string;
  parts: string[];
  instructions: string[];
  variablesNote: string;
  prediction: { question: string; options: string[] };
  observePrompt: string;
  reflection: string[];
  knowledge: KnowledgeItem[];
}

export interface DiagramProps<P extends LabParams> {
  params: P;
  motion?: MotionRef;
  playing?: boolean;
  className?: string;
}

export interface View3DProps<P extends LabParams> {
  params: P;
  motion: MotionRef;
  playing: boolean;
}

/**
 * Everything the shared lab template needs to know about one machine. Physics stays in the
 * machine's own module; this only connects it to the template.
 */
export interface MachineDefinition<P extends LabParams> {
  id: LabId;
  machine: MachineId;
  title: string;
  icon: IconName;
  question: string;
  defaults: P;
  variables: ReadonlyArray<VariableSpec<P>>;
  validate(p: P): Validation;
  simulate(p: P): MachineRun;
  loadMassKg(p: P): number;
  /** Ruler resolution for this apparatus (m). */
  rulerResolutionM: number;
  labels: {
    inputDistance: string;
    outputDistance: string;
    /** e.g. "slope length ÷ height". */
    idealMA: string;
  };
  status: { idle: string; running: string; finished: string };
  equations: Equation[];
  assumptions: string[];
  /** Independent variable for the "what your data show" comparison. */
  trend: { key: keyof P & string; label: string; unit: string };
  trialColumns: ReadonlyArray<{ key: keyof P & string; label: string; digits: number }>;
  guide: GuideContent;
  Diagram: ComponentType<DiagramProps<P>>;
  View3D: LazyExoticComponent<ComponentType<View3DProps<P>>>;
}

/** A preset camera position for the 3D view. */
export interface CameraView {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}
