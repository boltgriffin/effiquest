import { RoundedBox } from '@react-three/drei';
import { useLabMaterials } from './materials';
import { useRealism } from './quality';

/**
 * A gloved hand gripping a rope or handle that runs along its local X axis through the origin
 * (true size: palm about 9 cm). The glove is in the effort colour, so "where the effort acts" reads
 * the same as in the diagrams. Position and rotate it from the scene.
 */
export function GlovedHand({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const m = useLabMaterials();
  const r = useRealism();
  const seg = Math.max(8, r.segments / 3);
  // Four curled fingers wrap round the grip (X axis); the thumb closes over them.
  const fingers = [-0.033, -0.011, 0.011, 0.032];
  return (
    <group position={position} rotation={rotation}>
      {/* Palm behind the grip */}
      <RoundedBox
        args={[0.085, 0.09, 0.03]}
        radius={0.012}
        smoothness={2}
        position={[0, -0.01, -0.03]}
        material={m.glove}
      />
      {fingers.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          {/* curled finger: two segments around the grip */}
          <mesh position={[0, 0.022, -0.008]} rotation={[0.6, 0, 0]} material={m.glove}>
            <capsuleGeometry args={[0.0095, 0.03 - i * 0.002, 4, seg]} />
          </mesh>
          <mesh position={[0, 0.012, 0.018]} rotation={[2.2, 0, 0]} material={m.glove}>
            <capsuleGeometry args={[0.009, 0.022, 4, seg]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.05, -0.012, 0.012]} rotation={[0.4, 0, 0.9]} material={m.glove}>
        <capsuleGeometry args={[0.011, 0.035, 4, seg]} />
      </mesh>
      {/* Cuff */}
      <mesh position={[0, -0.07, -0.03]} material={m.darkSteel}>
        <cylinderGeometry args={[0.04, 0.045, 0.05, seg]} />
      </mesh>
    </group>
  );
}
