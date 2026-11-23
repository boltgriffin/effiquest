let cached: boolean | undefined;

/**
 * Whether this device can show the 3D view. Checked ONCE per page load and the test context is
 * released at once: browsers allow only a few WebGL contexts, and the lab re-renders many times
 * during a run (checking on every render used to exhaust the limit and crash the 3D view).
 */
export function isWebGLAvailable(doc: Pick<Document, 'createElement'> = document): boolean {
  if (doc === document && cached !== undefined) return cached;
  let ok: boolean;
  try {
    const canvas = doc.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as
      WebGLRenderingContext | WebGL2RenderingContext | null;
    ok = Boolean(gl);
    try {
      gl?.getExtension?.('WEBGL_lose_context')?.loseContext();
    } catch {
      // Releasing is best effort; the answer stands.
    }
  } catch {
    ok = false;
  }
  if (doc === document) cached = ok;
  return ok;
}
