import { describe, expect, it } from 'vitest';
import {
  circleAreaM2,
  convert,
  cosDeg,
  degToRad,
  fixed,
  fromSI,
  radToDeg,
  roundTo,
  sig,
  sinDeg,
  toSI,
  weightN,
  withUnit,
} from './index';

describe('unit conversions to and from SI', () => {
  it('converts length, mass, time, force, energy, power, area and pressure', () => {
    expect(toSI('length', 150, 'cm')).toBeCloseTo(1.5, 12);
    expect(toSI('length', 2.5, 'km')).toBe(2500);
    expect(toSI('mass', 500, 'g')).toBeCloseTo(0.5, 12);
    expect(toSI('time', 2, 'min')).toBe(120);
    expect(toSI('force', 1.2, 'kN')).toBe(1200);
    expect(toSI('energy', 3, 'kJ')).toBe(3000);
    expect(toSI('power', 0.75, 'kW')).toBe(750);
    expect(toSI('area', 10, 'cm²')).toBeCloseTo(0.001, 12);
    expect(toSI('pressure', 50, 'kPa')).toBe(50000);
  });

  it('round-trips and converts between non-SI units', () => {
    expect(fromSI('length', toSI('length', 37, 'mm'), 'mm')).toBeCloseTo(37, 12);
    expect(convert('length', 1, 'm', 'cm')).toBeCloseTo(100, 12);
    expect(convert('time', 1, 'h', 'min')).toBe(60);
    expect(convert('area', 1, 'm²', 'cm²')).toBeCloseTo(10000, 8);
  });

  it('handles angles and trigonometry exactly at textbook angles', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 12);
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 12);
    expect(cosDeg(90)).toBe(0);
    expect(cosDeg(60)).toBe(0.5);
    expect(cosDeg(180)).toBe(-1);
    expect(sinDeg(30)).toBe(0.5);
    expect(sinDeg(180)).toBe(0);
    expect(cosDeg(45)).toBeCloseTo(Math.SQRT1_2, 12);
  });

  it('keeps mass and weight apart, and computes piston areas', () => {
    expect(weightN(10)).toBeCloseTo(98.1, 12);
    expect(circleAreaM2(0.02)).toBeCloseTo(3.14159e-4, 8);
  });
});

describe('rounding and display formatting', () => {
  it('rounds half away from zero without float artefacts', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(-1.005, 2)).toBe(-1.01);
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(74.2681, 1)).toBe(74.3);
    expect(roundTo(1.23e-7, 9)).toBe(1.23e-7);
    expect(roundTo(-0.0001, 2)).toBe(0);
  });

  it('formats significant figures, fixed decimals and units', () => {
    expect(sig(132.08)).toBe('132.1');
    expect(sig(5000)).toBe('5,000');
    expect(sig(0.000123456, 3)).toBe('0.000123');
    expect(sig(0)).toBe('0');
    expect(fixed(74.27, 1)).toBe('74.3');
    expect(fixed(2, 2)).toBe('2.00');
    expect(withUnit(74.27, '%')).toBe('74.27%');
    expect(withUnit(98.1, 'N')).toBe('98.1 N');
    expect(withUnit(4, '')).toBe('4');
  });
});
