"use client";

import { useState, useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Edit2, Move, Trash2 } from "lucide-react";
import type { AnchorPoint } from "@/types";

interface AnchorMarkerProps {
  data: AnchorPoint;
  isSelected: boolean;
  isRelocating: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    newLabel: string,
    newDescription: string,
    newPosition: [number, number, number]
  ) => void;
  onStartRelocation: (id: string) => void;
  onEditingStateChange: (isEditing: boolean) => void;
}

const stopInputPropagation = (e: React.SyntheticEvent) => {
  e.stopPropagation();
  if (e.nativeEvent) {
    e.nativeEvent.stopImmediatePropagation();
  }
};

export const AnchorMarker = ({
  data,
  isSelected,
  isRelocating,
  onSelect,
  onDelete,
  onUpdate,
  onStartRelocation,
  onEditingStateChange,
}: AnchorMarkerProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const labelRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isSelected) {
      if (isEditing) {
        setIsEditing(false);
        onEditingStateChange(false);
      }
    }
  }, [isSelected, isEditing, onEditingStateChange]);

  const handleUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentLabel = labelRef.current?.value || "";
    const currentDesc = descRef.current?.value || "";

    if (!currentDesc.trim()) {
      // バリデーションエラーは親コンポーネントで処理される
      return;
    }
    onUpdate(data.id, currentLabel, currentDesc, data.position);
    setIsEditing(false);
    onEditingStateChange(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(data.id);
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    onEditingStateChange(true);
  };

  const handleRelocationStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    onStartRelocation(data.id);
  };

  return (
    <group position={data.position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (!isRelocating) onSelect();
        }}
        raycast={isRelocating ? () => null : THREE.Mesh.prototype.raycast}
        onPointerOver={() =>
          !isRelocating &&
          isSelected &&
          (document.body.style.cursor = "pointer")
        }
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial
          color={isRelocating ? "lime" : isSelected ? "white" : data.color}
          emissive={
            isRelocating ? "lime" : isSelected ? "white" : data.color
          }
          emissiveIntensity={isRelocating ? 0.8 : isSelected ? 0.8 : 0.5}
        />
      </mesh>

      {!isSelected && !isRelocating && (
        <Html
          position={[0, 0.25, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
          zIndexRange={[0, 50]}
        >
          <div className="flex justify-center">
            <div className="bg-black/40 backdrop-blur-[2px] px-2 py-0.5 rounded text-[10px] text-white/90 font-medium whitespace-nowrap border border-white/10 shadow-sm">
              {data.label}
            </div>
          </div>
        </Html>
      )}

      {isSelected && !isRelocating && (
        <Html
          position={[0, 0.3, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: "auto" }}
          zIndexRange={[100, 0]}
        >
          <div
            className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
            onPointerDown={stopInputPropagation}
            onClick={stopInputPropagation}
          >
            <div className="relative flex flex-col rounded-lg bg-slate-950/90 p-3 text-white shadow-2xl backdrop-blur-md border border-white/10 w-[220px]">
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-950/90"></div>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] text-slate-400 text-center font-bold">
                    内容を編集
                  </p>

                  <input
                    type="text"
                    ref={labelRef}
                    defaultValue={data.label}
                    onKeyDown={stopInputPropagation}
                    onKeyUp={stopInputPropagation}
                    onPointerDown={stopInputPropagation}
                    className="w-full bg-slate-800 rounded px-2 py-1 text-xs text-white border border-slate-700 focus:outline-none focus:border-blue-500"
                    placeholder="名前"
                  />

                  <textarea
                    ref={descRef}
                    defaultValue={data.description}
                    onKeyDown={stopInputPropagation}
                    onKeyUp={stopInputPropagation}
                    onPointerDown={stopInputPropagation}
                    className="w-full bg-slate-800 rounded px-2 py-1 text-xs text-white border border-slate-700 focus:outline-none focus:border-blue-500 min-h-[50px] resize-none"
                    placeholder="意図を入力..."
                  />

                  <button
                    onClick={handleUpdate}
                    className="w-full py-1 bg-green-600 hover:bg-green-500 rounded text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="text-[10px] font-bold">保存</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)] flex-shrink-0"></div>
                    <span className="text-sm font-bold text-white truncate">
                      {data.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap break-words leading-5 mb-3">
                    {data.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <button
                      onPointerDown={handleRelocationStart}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-800 hover:bg-blue-600 text-[10px] text-slate-300 hover:text-white transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <Move className="w-3 h-3" />
                      <span>移動（長押し）</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleEditStart}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}

      <mesh
        position={[0, -data.position[1] / 2, 0]}
        raycast={isRelocating ? () => null : undefined}
      >
        <cylinderGeometry args={[0.015, 0.015, data.position[1], 8]} />
        <meshBasicMaterial
          color={isRelocating ? "lime" : data.color}
          opacity={0.5}
          transparent
        />
      </mesh>

      {isRelocating && (
        <mesh
          position={[0, -data.position[1] + 0.01, 0]}
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
      )}
    </group>
  );
};

