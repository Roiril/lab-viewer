"use client";

import { useRef } from "react";
import * as THREE from "three";

interface ClickableFloorProps {
  isAddingMode: boolean;
  isRelocating: boolean;
  onDragStart: (point: THREE.Vector3) => void;
  onDragMove: (point: THREE.Vector3) => void;
  onDragEnd: () => void;
  onDeselect: () => void;
}

export const ClickableFloor = ({
  isAddingMode,
  isRelocating,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDeselect,
}: ClickableFloorProps) => {
  const isDragging = useRef(false);
  const isActive = isAddingMode || isRelocating;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      visible={true}
      onPointerDown={(e) => {
        if (isActive) {
          e.stopPropagation();

          const target = e.nativeEvent.target as HTMLElement;
          target.setPointerCapture(e.pointerId);

          isDragging.current = true;
          onDragStart(e.point);
        } else {
          onDeselect();
        }
      }}
      onPointerMove={(e) => {
        if (isActive && isDragging.current) {
          e.stopPropagation();
          onDragMove(e.point);
        }
      }}
      onPointerUp={(e) => {
        if (isActive && isDragging.current) {
          e.stopPropagation();

          const target = e.nativeEvent.target as HTMLElement;
          if (target.hasPointerCapture(e.pointerId)) {
            target.releasePointerCapture(e.pointerId);
          }

          isDragging.current = false;
          onDragEnd();
        }
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

