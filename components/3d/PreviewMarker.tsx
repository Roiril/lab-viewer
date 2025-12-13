"use client";

import * as THREE from "three";

interface PreviewMarkerProps {
  position: [number, number, number];
  isVisible: boolean;
}

export const PreviewMarker = ({
  position,
  isVisible,
}: PreviewMarkerProps) => {
  if (!isVisible) return null;
  return (
    <group position={position}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial
          color="lime"
          emissive="lime"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh
        position={[0, -position[1] + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <ringGeometry args={[0.1, 0.25, 32]} />
        <meshBasicMaterial
          color="lime"
          side={THREE.DoubleSide}
          opacity={0.6}
          transparent
        />
      </mesh>
      <mesh position={[0, -position[1] / 2, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.015, 0.015, position[1], 8]} />
        <meshBasicMaterial color="lime" opacity={0.6} transparent />
      </mesh>
    </group>
  );
};

