"use client";

import { useGLTF } from "@react-three/drei";

interface RoomModelProps {
  url: string;
}

export const RoomModel = ({ url }: RoomModelProps) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.0} position={[0, 0, 0]} />;
};

