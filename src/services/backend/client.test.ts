import { describe, expect, it } from 'vitest';
import { looksLikeServiceRole } from '@/config/env';
import { BackendError, toBackendError, unwrap } from './client';
import {
  checkClassName,
  checkEmail,
  checkJoinCode,
  checkPassword,
  checkSchoolYear,
} from './validation';

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.sig`;

describe('secret keys are refused in the browser', () => {
  it('detects service-role JWTs and sb_secret_ keys, accepts anon keys', () => {
    expect(looksLikeServiceRole(jwt({ role: 'service_role' }))).toBe(true);
    expect(looksLikeServiceRole('sb_secret_abc123')).toBe(true);
    expect(looksLikeServiceRole(jwt({ role: 'anon' }))).toBe(false);
    expect(looksLikeServiceRole('sb_publishable_abc123')).toBe(false);
  });
});

describe('errors shown to people are safe', () => {
  it('passes through messages written by our SQL functions', () => {
    const e = toBackendError({ code: '22023', message: 'No open class has that code.' });
    expect(e).toMatchObject({ kind: 'invalid', message: 'No open class has that code.' });
  });

  it('hides raw RLS and permission details', () => {
    const e = toBackendError({
      code: '42501',
      message: 'new row violates row-level security policy for table "classes"',
    });
    expect(e.kind).toBe('forbidden');
    expect(e.message).not.toMatch(/row-level|classes/);
  });

  it('turns network failures into an offline message that reassures about local data', () => {
    const e = toBackendError(new TypeError('Failed to fetch'));
    expect(e.kind).toBe('offline');
    expect(e.message).toMatch(/safe on this device/);
  });

  it('never echoes unknown server text (which could include tokens or SQL)', () => {
    const e = toBackendError({ code: 'XX000', message: 'internal: token=eyJ... select * from x' });
    expect(e.kind).toBe('unknown');
    expect(e.message).not.toMatch(/token|select/);
  });

  it('unwrap throws BackendError on error and returns data otherwise', () => {
    expect(unwrap({ data: [1], error: null })).toEqual([1]);
    expect(() => unwrap({ data: null, error: { code: '22023', message: 'Bad.' } })).toThrow(
      BackendError,
    );
  });
});

describe('input checks', () => {
  it('class codes', () => {
    expect(checkJoinCode(' 3fa9 c01b ')).toEqual({ ok: true, value: '3FA9C01B' });
    expect(checkJoinCode('XYZ').ok).toBe(false);
  });
  it('email and password', () => {
    expect(checkEmail('teacher@school.example').ok).toBe(true);
    expect(checkEmail('nope').ok).toBe(false);
    expect(checkPassword('short').ok).toBe(false);
    expect(checkPassword('long enough').ok).toBe(true);
  });
  it('class name and school year', () => {
    expect(checkClassName('  G11   STEM A ')).toEqual({ ok: true, value: 'G11 STEM A' });
    expect(checkClassName(' ').ok).toBe(false);
    expect(checkSchoolYear('')).toEqual({ ok: true, value: null });
    expect(checkSchoolYear('2026-2027').ok).toBe(true);
    expect(checkSchoolYear('2026-2028').ok).toBe(false);
  });
});
