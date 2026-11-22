/**
 * Shared result shape for every learner-facing calculation (docs/PHYSICS_CALCULATIONS.md).
 * Pure data: the UI decides how to show it.
 */

/**
 * Where the input numbers came from.
 *  - ideal: a theoretical, loss-free value from geometry or an idealised law (e.g. IMA, Pascal).
 *  - measured: computed from instrument readings a learner took.
 *  - simulated: computed from the app's physics model (energy ledger).
 * Ideal results are never presented as if they were measured, and vice versa.
 */
export type Basis = 'ideal' | 'measured' | 'simulated';

export interface CalcError {
  /** Name of the input that is wrong, e.g. "inputWorkJ". */
  field: string;
  /** Learner-readable message. */
  message: string;
}

export interface Calculation {
  ok: true;
  /** Plain-language name, e.g. "Efficiency". */
  quantity: string;
  /** Symbol, e.g. "η". */
  symbol: string;
  /** Exact (unrounded) value in SI units. Round only for display. */
  value: number;
  /** SI unit symbol, or "" for dimensionless quantities. */
  unit: string;
  basis: Basis;
  /** The formula used, e.g. "η = W_out ÷ W_in × 100%". */
  formula: string;
  /** The formula with the numbers put in, e.g. "η = 98.1 J ÷ 132 J × 100% = 74.3%". */
  substitution: string;
  /** What the number means, written for Grade 11. */
  explanation: string;
  /** Conditions under which the formula is valid. */
  assumptions: string[];
  /** Valid result, but something the learner should notice (e.g. "zero work at 90°"). */
  warnings: string[];
  /** Traceability: concept-note objective (SRC-…) or recommendation (REC/BRF). */
  source: string;
}

export interface CalcFailure {
  ok: false;
  quantity: string;
  errors: CalcError[];
}

export type CalcResult = Calculation | CalcFailure;

export interface CalcOptions {
  /** Defaults depend on the calculation (see each function). */
  basis?: Basis;
}
