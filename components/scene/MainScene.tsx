"use client";

import { Suspense } from "react";
import {
    Environment,
    ContactShadows,
    PerspectiveCamera,
    CameraControls,
} from "@react-three/drei";
import * as THREE from "three";
import { RoomModel } from "@/components/3d/RoomModel";
import { ClickableFloor } from "@/components/3d/ClickableFloor";
import { AnchorMarker } from "@/components/3d/AnchorMarker";
import { PreviewMarker } from "@/components/3d/PreviewMarker";
import { Loader } from "@/components/ui/Loader";
import type { AnchorPoint } from "@/types";

interface MainSceneProps {
    modelUrl: string;
    anchors: AnchorPoint[];
    isScanning: boolean;
    isAddingMode: boolean;
    relocatingAnchorId: string | null;
    selectedAnchorId: string | null;
    tempPosition: [number, number, number] | null;
    controlsRef: React.RefObject<CameraControls | null>;
    onFloorDragStart: (point: THREE.Vector3) => void;
    onFloorDragMove: (point: THREE.Vector3) => void;
    onFloorDragEnd: () => void;
    onDeselect: () => void;
    onAnchorSelect: (id: string, position: [number, number, number]) => void;
    onAnchorDelete: (id: string) => void;
    onAnchorUpdate: (id: string, label: string, desc: string, pos: [number, number, number]) => void;
    onStartRelocation: (id: string) => void;
    onEditingStateChange: (isEditing: boolean) => void;
    isEditingAnchor: boolean;
}

export const MainScene = ({
    modelUrl,
    anchors,
    isScanning,
    isAddingMode,
    relocatingAnchorId,
    selectedAnchorId,
    tempPosition,
    controlsRef,
    onFloorDragStart,
    onFloorDragMove,
    onFloorDragEnd,
    onDeselect,
    onAnchorSelect,
    onAnchorDelete,
    onAnchorUpdate,
    onStartRelocation,
    onEditingStateChange,
    isEditingAnchor,
}: MainSceneProps) => {
    return (
        <Suspense fallback={<Loader />}>
            <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={45} />
            <color attach="background" args={["#0a0a0c"]} />
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 20, 10]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[4096, 4096]}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
            />
            <Environment preset="city" environmentIntensity={0.6} />

            <group>
                <RoomModel url={modelUrl} />

                <ClickableFloor
                    isAddingMode={isAddingMode}
                    isRelocating={!!relocatingAnchorId}
                    onDragStart={onFloorDragStart}
                    onDragMove={onFloorDragMove}
                    onDragEnd={onFloorDragEnd}
                    onDeselect={onDeselect}
                />

                {isScanning &&
                    anchors.map((anchor) => (
                        <AnchorMarker
                            key={anchor.id}
                            data={anchor}
                            isSelected={selectedAnchorId === anchor.id}
                            isRelocating={relocatingAnchorId === anchor.id}
                            onSelect={() => onAnchorSelect(anchor.id, anchor.position)}
                            onDelete={onAnchorDelete}
                            onUpdate={onAnchorUpdate}
                            onStartRelocation={onStartRelocation}
                            onEditingStateChange={onEditingStateChange}
                        />
                    ))}

                {isAddingMode && tempPosition && (
                    <PreviewMarker position={tempPosition} isVisible={true} />
                )}
            </group>

            <CameraControls
                ref={controlsRef}
                makeDefault
                maxPolarAngle={Math.PI / 2 - 0.05}
                minDistance={2}
                maxDistance={30}
                enabled={!isAddingMode && !relocatingAnchorId && !isEditingAnchor}
                dollySpeed={0.6}
                truckSpeed={0.6}
                smoothTime={0.4}
            />
            <ContactShadows
                position={[0, -0.01, 0]}
                opacity={0.6}
                scale={40}
                blur={2.5}
                far={5}
                resolution={1024}
                color="#000000"
            />
        </Suspense>
    );
};
