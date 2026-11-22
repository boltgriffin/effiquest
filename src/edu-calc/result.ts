import type { Basis, Calculation } from './types';

/** Builds a successful result; every field is required so nothing is forgotten. */
export function result(r: {
  quantity: string;
  symbol: string;
  value: number;
  unit: string;
  basis: Basis;
  formula: string;
  substitution: string;
  explanation: string;
  assumptions: string[];
  warnings?: string[];
  source: string;
}): Calculation {
  return { ok: true, warnings: [], ...r };
}

/** Wording that makes the basis visible in explanations. */
export const basisPhrase: Record<Basis, string> = {
  ideal: 'This is an ideal (theoretical) value with no losses.',
  measured: 'This value comes from your measurements.',
  simulated: "This value comes from the lab's physics model.",
};
