import { withUnit } from './format';
import { basisPhrase, result } from './result';
import type { CalcOptions, CalcResult } from './types';
import { Inputs } from './validation';

/**
 * Hydraulics. Source: SRC-O4 (Pascal's law applied to brakes, lifts, excavators).
 */

export interface PressureInput {
  forceN: number;
  areaM2: number;
}

/** Pressure: P = F ÷ A. */
export function pressure(input: PressureInput, opts: CalcOptions = {}): CalcResult {
  const v = new Inputs()
    .nonNegative('forceN', 'Force', input.forceN, 'N')
    .positive('areaM2', 'Area', input.areaM2, 'm²');
  if (!v.ok) return v.fail('Pressure');

  const basis = opts.basis ?? 'measured';
  const value = input.forceN / input.areaM2;
  return result({
    quantity: 'Pressure',
    symbol: 'P',
    value,
    unit: 'Pa',
    basis,
    formula: 'P = F ÷ A',
    substitution: `P = ${withUnit(input.forceN, 'N')} ÷ ${withUnit(input.areaM2, 'm²')} = ${withUnit(value, 'Pa')}`,
    explanation: `Pressure is force spread over an area: 1 Pa is 1 N on every square metre. The same force on a smaller area gives a larger pressure. ${basisPhrase[basis]}`,
    assumptions: ['The force acts evenly and at right angles to the area.'],
    source: 'SRC-O4',
  });
}

export interface PascalInput {
  /** Force on the small (input) piston (N). */
  inputForceN: number;
  /** Area of the input piston (m²). */
  inputAreaM2: number;
  /** Area of the output piston (m²). */
  outputAreaM2: number;
}

/**
 * Pascal's principle, ideal output force: F₁ ÷ A₁ = F₂ ÷ A₂ ⇒ F₂ = F₁ × A₂ ÷ A₁.
 * Always an ideal value: real presses lose some force to seal friction and leakage.
 */
export function pascalOutputForce(input: PascalInput): CalcResult {
  const v = new Inputs()
    .nonNegative('inputForceN', 'Input force', input.inputForceN, 'N')
    .positive('inputAreaM2', 'Input piston area', input.inputAreaM2, 'm²')
    .positive('outputAreaM2', 'Output piston area', input.outputAreaM2, 'm²');
  if (!v.ok) return v.fail('Output force');

  const ratio = input.outputAreaM2 / input.inputAreaM2;
  const p = input.inputForceN / input.inputAreaM2;
  const value = input.inputForceN * ratio;
  return result({
    quantity: 'Output force (ideal)',
    symbol: 'F₂',
    value,
    unit: 'N',
    basis: 'ideal',
    formula: 'F₁ ÷ A₁ = F₂ ÷ A₂, so F₂ = F₁ × A₂ ÷ A₁',
    substitution: `F₂ = ${withUnit(input.inputForceN, 'N')} × ${withUnit(input.outputAreaM2, 'm²')} ÷ ${withUnit(input.inputAreaM2, 'm²')} = ${withUnit(value, 'N')}`,
    explanation: `Pressure is passed equally through the fluid (${withUnit(p, 'Pa')} at both pistons). The output piston is ${withUnit(ratio, '')} times larger, so the force is ${withUnit(ratio, '')} times larger. The output piston moves ${withUnit(ratio, '')} times less distance, so no energy is created. ${basisPhrase.ideal}`,
    assumptions: [
      'The fluid cannot be compressed and does not leak.',
      'No friction at the piston seals.',
      'Both pistons are at the same height (no extra pressure from fluid depth).',
    ],
    warnings:
      ratio < 1
        ? ['The output piston is smaller, so the output force is smaller than the input.']
        : [],
    source: 'SRC-O4',
  });
}

/** Ideal output piston travel: d₂ = d₁ × A₁ ÷ A₂ (the same volume of fluid moves). */
export function pascalOutputDistance(input: {
  inputDistanceM: number;
  inputAreaM2: number;
  outputAreaM2: number;
}): CalcResult {
  const v = new Inputs()
    .nonNegative('inputDistanceM', 'Input piston travel', input.inputDistanceM, 'm')
    .positive('inputAreaM2', 'Input piston area', input.inputAreaM2, 'm²')
    .positive('outputAreaM2', 'Output piston area', input.outputAreaM2, 'm²');
  if (!v.ok) return v.fail('Output piston travel');

  const value = (input.inputDistanceM * input.inputAreaM2) / input.outputAreaM2;
  return result({
    quantity: 'Output piston travel (ideal)',
    symbol: 'd₂',
    value,
    unit: 'm',
    basis: 'ideal',
    formula: 'd₂ = d₁ × A₁ ÷ A₂',
    substitution: `d₂ = ${withUnit(input.inputDistanceM, 'm')} × ${withUnit(input.inputAreaM2, 'm²')} ÷ ${withUnit(input.outputAreaM2, 'm²')} = ${withUnit(value, 'm')}`,
    explanation: `The fluid pushed out of the small cylinder fills the large one, so the large piston moves a shorter distance. Force goes up, distance goes down: in an ideal press, work in equals work out. ${basisPhrase.ideal}`,
    assumptions: ['The fluid cannot be compressed and does not leak.'],
    source: 'SRC-O4',
  });
}
