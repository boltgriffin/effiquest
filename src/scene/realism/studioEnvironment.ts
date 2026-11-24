import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useRealism } from './quality';

/**
 * Studio reflections (three.js RoomEnvironment, generated: no download) and the shadow switch,
 * following the 3D quality setting. Shared by LabStage and the welcome showcase stage.
 */
export function useStudioEnvironment(enabled = true) {
  const r = useRealism();
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);
  // The renderer and scene are three.js objects owned by the canvas; they are read from the
  // store inside effects (not captured from a hook) and configured there.
  useEffect(() => {
    if (!enabled) return;
    const { gl, scene } = get();
    gl.shadowMap.enabled = r.shadows;
    if (!r.environment) {
      scene.environment = null;
      invalidate();
      return;
    }
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.6;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      room.dispose?.();
    };
  }, [enabled, r.environment, r.shadows, get, invalidate]);
}
