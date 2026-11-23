import { InclineDiagram } from '../InclineDiagram';
import type { InclineParams } from '../params';
import { PulleyDiagram } from '../pulley/PulleyDiagram';
import type { PulleyLabParams } from '../pulley/params';
import type { DiagramProps } from '../shared/types';

/** Adapters giving the older diagrams the shared `DiagramProps` shape. */
export function InclineLabDiagram({
  params,
  motion,
  playing,
  className,
}: DiagramProps<InclineParams>) {
  return <InclineDiagram {...params} motion={motion} playing={playing} className={className} />;
}

export function PulleyLabDiagram({
  params,
  motion,
  playing,
  className,
}: DiagramProps<PulleyLabParams>) {
  return <PulleyDiagram params={params} motion={motion} playing={playing} className={className} />;
}
