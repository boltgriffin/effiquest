/**
 * Energy ledger: every machine model reports where its input work went.
 * Efficiency is computed ONLY from this ledger (docs/PHYSICS_MODEL_PLAN.md section 1):
 * η = useful work / input work × 100 %.
 */
export type LossKind = 'friction' | 'machine-parts';

export interface EnergyLoss {
  kind: LossKind;
  /** Plain-language label shown to learners, e.g. "Friction on the ramp". */
  label: string;
  joules: number;
}

export interface EnergyLedger {
  /** Work done by the learner's effort, W_in (J). */
  inputJ: number;
  /** Useful output work: potential energy gained by the load (J). */
  usefulJ: number;
  losses: EnergyLoss[];
  /** Change in kinetic energy over the run (J); ~0 for start-at-rest / end-at-rest runs. */
  deltaKineticJ: number;
}

/** Relative imbalance allowed by the numerical integrators (accounting identity check). */
export const LEDGER_TOLERANCE = 1e-3;

export function totalLosses(ledger: EnergyLedger): number {
  return ledger.losses.reduce((sum, l) => sum + l.joules, 0);
}

/** input − (useful + losses + ΔKE). Zero for a perfectly conserved run. */
export function imbalance(ledger: EnergyLedger): number {
  return ledger.inputJ - (ledger.usefulJ + totalLosses(ledger) + ledger.deltaKineticJ);
}

export type LedgerCheck =
  | { valid: true; efficiencyPercent: number }
  | {
      valid: false;
      reason: 'no-input-work' | 'energy-not-conserved' | 'exceeds-100' | 'negative-loss';
    };

/**
 * Validates the ledger and returns efficiency. Never clamps: an impossible result is reported as
 * invalid so the UI can show "measurement error" instead of a misleading number.
 */
export function checkLedger(ledger: EnergyLedger): LedgerCheck {
  if (!(ledger.inputJ > 0)) return { valid: false, reason: 'no-input-work' };
  if (ledger.losses.some((l) => l.joules < -LEDGER_TOLERANCE * ledger.inputJ)) {
    return { valid: false, reason: 'negative-loss' };
  }
  if (Math.abs(imbalance(ledger)) > LEDGER_TOLERANCE * ledger.inputJ) {
    return { valid: false, reason: 'energy-not-conserved' };
  }
  const efficiencyPercent = (ledger.usefulJ / ledger.inputJ) * 100;
  if (efficiencyPercent > 100 + LEDGER_TOLERANCE * 100)
    return { valid: false, reason: 'exceeds-100' };
  return { valid: true, efficiencyPercent };
}
