/** True when the browser can create a WebGL context. Used to choose between the 3D lab and a fallback. */
export function isWebGLAvailable(doc: Pick<Document, 'createElement'> = document): boolean {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
