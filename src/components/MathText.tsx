import type { ReactNode } from 'react';

/**
 * Text with simple math markup: "W_out" → W<sub>out</sub>, "x^2" → x<sup>2</sup>. Used by
 * equation cards and lesson text, so subscripts look the same everywhere.
 */
export function MathText({ text }: { text: string }) {
  const parts: ReactNode[] = text.split(/([_^][A-Za-z0-9]+)/g).map((part, i) => {
    if (part.startsWith('_')) return <sub key={i}>{part.slice(1)}</sub>;
    if (part.startsWith('^')) return <sup key={i}>{part.slice(1)}</sup>;
    return part;
  });
  return <>{parts}</>;
}
