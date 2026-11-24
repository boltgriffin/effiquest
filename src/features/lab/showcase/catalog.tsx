import type { ReactNode } from 'react';
import type { IconName } from '@/components/icons/Icon';
import { labs, type LabId } from '@/content/quests';
import { bicycleLab } from '../machines/bicycle';
import { brakeLab } from '../machines/brake';
import { hydraulicLab } from '../machines/hydraulic';
import { inclineLab } from '../machines/incline';
import { leverLab } from '../machines/lever';
import { pulleyLab } from '../machines/pulley';
import { screwLab } from '../machines/screw';
import { wedgeLab } from '../machines/wedge';
import { wheelAxleLab } from '../machines/wheelAxle';
import type { LabParams, MachineDefinition } from '../shared/types';

/**
 * The nine labs as the welcome showcase presents them. Every text comes from content that already
 * exists (no new lesson text): the lab list (`content/quests.ts`: title, route, question) and each
 * lab's guide (objective; the first sentence of its purpose). Only the category label is new.
 */
export interface ShowcaseItem {
  id: LabId;
  title: string;
  /** Existing lab route (`/lab/...`), handled by MachineLabPage. */
  to: string;
  icon: IconName;
  category: string;
  /** The lab's own question. */
  question: string;
  /** First sentence of the lab guide's "purpose". */
  summary: string;
  /** The lab guide's learning objective. */
  objective: string;
  /** The lab's 2D diagram at its default settings (shown while 3D loads, or without WebGL). */
  diagram: () => ReactNode;
}

/** Labels only (simple / fluid / compound), following docs/SIMPLE_MACHINES_LABS.md. */
const CATEGORY: Record<LabId, string> = {
  lever: 'Simple machine · First-class lever',
  incline: 'Simple machine · Inclined plane',
  pulley: 'Simple machine · Fixed and movable pulleys',
  wheel_axle: 'Simple machine · Wheel and axle',
  hydraulic: 'Hydraulic machine · Pascal’s principle',
  screw: 'Simple machine · Screw',
  wedge: 'Simple machine · Wedge',
  bicycle: 'Compound machine · Gears, chain and a hill',
  brake: 'Compound machine · Lever, fluid and friction',
};

/** The first sentence of a paragraph (the lab texts have no abbreviations with full stops). */
export function firstSentence(text: string): string {
  return /^.+?[.!?](?=\s|$)/.exec(text.trim())?.[0] ?? text.trim();
}

function fromDefinition<P extends LabParams>(def: MachineDefinition<P>) {
  const Diagram = def.Diagram;
  return {
    summary: firstSentence(def.guide.purpose),
    objective: def.guide.objective,
    diagram: () => <Diagram params={def.defaults} className="w-full" />,
  };
}

const DEFINITIONS: Record<LabId, ReturnType<typeof fromDefinition>> = {
  lever: fromDefinition(leverLab),
  incline: fromDefinition(inclineLab),
  pulley: fromDefinition(pulleyLab),
  wheel_axle: fromDefinition(wheelAxleLab),
  hydraulic: fromDefinition(hydraulicLab),
  screw: fromDefinition(screwLab),
  wedge: fromDefinition(wedgeLab),
  bicycle: fromDefinition(bicycleLab),
  brake: fromDefinition(brakeLab),
};

/** In the lab list's order: lever, inclined plane, pulley, ..., hydraulic brake. */
export const showcaseItems: readonly ShowcaseItem[] = labs.map((lab) => ({
  id: lab.id,
  title: lab.title,
  to: lab.to,
  icon: lab.icon,
  category: CATEGORY[lab.id],
  question: lab.question,
  ...DEFINITIONS[lab.id],
}));
