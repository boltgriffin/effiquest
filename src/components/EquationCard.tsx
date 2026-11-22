import type { ReactNode } from 'react';
import type { Equation } from '@/content/modules';

/** Turns "W_out / W_in" into W<sub>out</sub> / W<sub>in</sub>, and "x^2" into x<sup>2</sup>. */
function renderExpression(expression: string): ReactNode[] {
  return expression.split(/([_^][A-Za-z0-9]+)/g).map((part, i) => {
    if (part.startsWith('_')) return <sub key={i}>{part.slice(1)}</sub>;
    if (part.startsWith('^')) return <sup key={i}>{part.slice(1)}</sup>;
    return part;
  });
}

export function EquationCard({ equation }: { equation: Equation }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-brand py-1 pl-4">
      <p className="text-sm text-muted">{equation.name}</p>
      <p className="font-display text-2xl italic">{renderExpression(equation.expression)}</p>
      <p className="num text-xs text-muted">{equation.where}</p>
    </div>
  );
}
