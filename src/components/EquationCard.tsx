import type { Equation } from '@/content/modules';
import { MathText } from './MathText';

export function EquationCard({ equation }: { equation: Equation }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-brand py-1 pl-4">
      <p className="text-sm text-muted">{equation.name}</p>
      <p className="font-display text-2xl italic">
        <MathText text={equation.expression} />
      </p>
      <p className="num text-xs text-muted">{equation.where}</p>
    </div>
  );
}
