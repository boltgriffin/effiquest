import type { CalcError, CalcFailure } from './types';

/**
 * Collects input problems so a learner sees every mistake at once, not one per attempt.
 * Nothing is clamped or silently corrected.
 */
export class Inputs {
  readonly errors: CalcError[] = [];

  /** Must be a real number (not NaN or ±Infinity). Returns false when it is not. */
  finite(field: string, label: string, value: number): boolean {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      this.errors.push({ field, message: `${label} must be a number.` });
      return false;
    }
    return true;
  }

  positive(field: string, label: string, value: number, unit: string): this {
    if (this.finite(field, label, value) && value <= 0) {
      this.errors.push({
        field,
        message: `${label} must be greater than 0${unit ? ` ${unit}` : ''}.`,
      });
    }
    return this;
  }

  nonNegative(field: string, label: string, value: number, unit: string): this {
    if (this.finite(field, label, value) && value < 0) {
      this.errors.push({ field, message: `${label} cannot be negative.` });
    }
    void unit;
    return this;
  }

  /** Inclusive range check. */
  range(field: string, label: string, value: number, min: number, max: number, unit: string): this {
    if (this.finite(field, label, value) && (value < min || value > max)) {
      this.errors.push({
        field,
        message: `${label} must be between ${min} and ${max}${unit ? ` ${unit}` : ''}.`,
      });
    }
    return this;
  }

  add(field: string, message: string): this {
    this.errors.push({ field, message });
    return this;
  }

  get ok(): boolean {
    return this.errors.length === 0;
  }

  fail(quantity: string): CalcFailure {
    return { ok: false, quantity, errors: [...this.errors] };
  }
}
