import { describe, expect, it } from 'vitest';
import { isWebGLAvailable } from './webgl';

const docWith = (getContext: (id: string) => unknown) =>
  ({ createElement: () => ({ getContext }) }) as unknown as Document;

describe('isWebGLAvailable', () => {
  it('is true when a context can be created', () => {
    expect(isWebGLAvailable(docWith(() => ({})))).toBe(true);
  });
  it('is false when no context is available', () => {
    expect(isWebGLAvailable(docWith(() => null))).toBe(false);
  });
  it('is false when context creation throws', () => {
    expect(
      isWebGLAvailable(
        docWith(() => {
          throw new Error('blocked');
        }),
      ),
    ).toBe(false);
  });
});
