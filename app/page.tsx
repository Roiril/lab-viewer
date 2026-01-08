"use client";

import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { X } from "lucide-react";

import { ErrorToast } from "@/components/ui/ErrorToast";
import { useAnchors } from "@/hooks/useAnchors";
import { DEFAULT_MODEL_URL, FIXED_HEIGHT } from "@/lib/constants";
import { useAnchorUIState } from "@/features/anchors/hooks/useAnchorUIState";
import { MainScene } from "@/components/scene/MainScene";
import { AnchorActionButtons } from "@/features/anchors/components/AnchorActionButtons";
import { AnchorForm } from "@/features/anchors/components/AnchorForm";

export default function IntentLayerPage() {
  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL_URL);
  const {
    anchors,
    fetchAnchors,
    createAnchor,
    updateAnchor,
    deleteAnchor,
    setAnchors,
  } = useAnchors();

  const ui = useAnchorUIState();
  const controlsRef = useRef<CameraControls>(null);

  useEffect(() => {
    fetchAnchors().catch((err) => {
      ui.setErrorMessage("アンカーの読み込みに失敗しました");
      console.error(err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ui.isAddingMode || ui.relocatingAnchorId) {
      if (controlsRef.current) {
        controlsRef.current.setLookAt(0, 20, 6, 0, 0, 0, true);
      }
    }
  }, [ui.isAddingMode, ui.relocatingAnchorId]);

  const handleScanButtonClick = async () => {
    if (ui.isRefreshing) return;
    if (ui.isScanning) {
      ui.setIsScanning(false);
      ui.setSelectedAnchorId(null);
      return;
    }
    try {
      ui.setIsRefreshing(true);
      await fetchAnchors();
      ui.setIsScanning(true);
    } catch (err) {
      ui.setErrorMessage("アンカーの更新に失敗しました");
      console.error(err);
    } finally {
      ui.setIsRefreshing(false);
    }
  };

  const handleFloorDragStart = (point: THREE.Vector3) => {
    const newPos: [number, number, number] = [point.x, FIXED_HEIGHT, point.z];
    if (ui.isAddingMode) {
      ui.setTempPosition(newPos);
      ui.setShowInputForm(false);
    } else if (ui.relocatingAnchorId) {
      setAnchors((prev) =>
        prev.map((a) =>
          a.id === ui.relocatingAnchorId ? { ...a, position: newPos } : a
        )
      );
    }
  };

  const handleFloorDragMove = (point: THREE.Vector3) => {
    const newPos: [number, number, number] = [point.x, FIXED_HEIGHT, point.z];
    if (ui.isAddingMode) {
      ui.setTempPosition(newPos);
    } else if (ui.relocatingAnchorId) {
      setAnchors((prev) =>
        prev.map((a) =>
          a.id === ui.relocatingAnchorId ? { ...a, position: newPos } : a
        )
      );
    }
  };

  const handleFloorDragEnd = () => {
    if (ui.isAddingMode) {
      if (ui.tempPosition) ui.setShowInputForm(true);
    } else if (ui.relocatingAnchorId) {
      confirmRelocation();
    }
  };

  const confirmRelocation = async () => {
    const idToUpdate = ui.relocatingAnchorId;
    if (!idToUpdate) return;
    const anchor = anchors.find((a) => a.id === idToUpdate);
    if (!anchor) return;
    ui.setRelocatingAnchorId(null);
    try {
      ui.setIsSaving(true);
      await updateAnchor(idToUpdate, { position: anchor.position });
    } catch (err) {
      ui.setErrorMessage("位置の更新に失敗しました");
      console.error(err);
      await fetchAnchors();
    } finally {
      ui.setIsSaving(false);
    }
  };

  const handleSaveNew = async () => {
    if (!ui.tempPosition || !ui.newLabel || !ui.newDescription) return;
    try {
      ui.setIsSaving(true);
      await createAnchor({
        label: ui.newLabel,
        description: ui.newDescription,
        color: "lime",
        position: ui.tempPosition,
      });
      ui.resetAddMode();
      ui.setIsScanning(true);
    } catch (err) {
      ui.setErrorMessage("保存に失敗しました");
      console.error(err);
    } finally {
      ui.setIsSaving(false);
    }
  };

  const focusOnAnchor = (position: [number, number, number]) => {
    if (!controlsRef.current) return;
    const [x, y, z] = position;
    const camera = controlsRef.current.camera;
    const currentPos = camera.position;
    const targetV = new THREE.Vector3(x, y, z);
    const direction = new THREE.Vector3()
      .subVectors(currentPos, targetV)
      .normalize();
    const dist = 5;
    const newCamPos = targetV.clone().add(direction.multiplyScalar(dist));
    if (newCamPos.y < 1.0) newCamPos.y = 1.0;

    controlsRef.current.setLookAt(
      newCamPos.x, newCamPos.y, newCamPos.z,
      x, y, z,
      true
    );
  };

  const roomModels = [
    { name: "ラボモデル", url: DEFAULT_MODEL_URL },
    { name: "7Fモデル", url: "https://jrwhqtiruhydherhwkqc.supabase.co/storage/v1/object/public/room-models/7fScan.glb" },
  ];

  return (
    <div className="relative h-[100dvh] w-full bg-[#050508] text-white overflow-hidden select-none">
      {ui.errorMessage && (
        <ErrorToast
          message={ui.errorMessage}
          onClose={() => ui.setErrorMessage(null)}
        />
      )}

      {/* Header UI */}
      <div className="absolute top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none">
        <div className="flex items-center gap-5 bg-black/40 backdrop-blur-2xl px-10 py-5 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto">
          <h1 className="text-2xl font-black tracking-tighter text-white/95">
            INTENT LAYER
          </h1>
          <div className="h-5 w-px bg-white/10" />
          <div
            className={`w-3 h-3 rounded-full transition-all duration-700 ${ui.isScanning
              ? "bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.9)]"
              : "bg-slate-700"
              }`}
          />
        </div>
      </div>

      {/* Model Switcher UI */}
      <div className="absolute top-6 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
        <div className="flex flex-col bg-black/30 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto">
          {roomModels.map((model) => (
            <button
              key={model.url}
              onClick={() => setModelUrl(model.url)}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${modelUrl === model.url
                ? "bg-white/15 text-white shadow-inner"
                : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
                }`}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>

      <Canvas shadows>
        <MainScene
          modelUrl={modelUrl}
          anchors={anchors}
          isScanning={ui.isScanning}
          isAddingMode={ui.isAddingMode}
          relocatingAnchorId={ui.relocatingAnchorId}
          selectedAnchorId={ui.selectedAnchorId}
          tempPosition={ui.tempPosition}
          controlsRef={controlsRef}
          onFloorDragStart={handleFloorDragStart}
          onFloorDragMove={handleFloorDragMove}
          onFloorDragEnd={handleFloorDragEnd}
          onDeselect={() => {
            if (!ui.relocatingAnchorId && !ui.isAddingMode)
              ui.setSelectedAnchorId(null);
          }}
          onAnchorSelect={(id, pos) => {
            if (!ui.relocatingAnchorId && !ui.isAddingMode) {
              ui.setSelectedAnchorId(id);
              focusOnAnchor(pos);
            }
          }}
          onAnchorDelete={async (id) => {
            if (confirm("この意図を削除しますか？")) {
              try {
                await deleteAnchor(id);
                ui.setSelectedAnchorId(null);
              } catch (err) {
                ui.setErrorMessage("削除に失敗しました");
                console.error(err);
              }
            }
          }}
          onAnchorUpdate={async (id, label, desc, pos) => {
            if (!desc.trim()) {
              ui.setErrorMessage("意図は必須です");
              return;
            }
            try {
              await updateAnchor(id, { label, description: desc, position: pos });
            } catch (err) {
              ui.setErrorMessage("更新に失敗しました");
              console.error(err);
              await fetchAnchors();
            }
          }}
          onStartRelocation={(id) => {
            ui.setRelocatingAnchorId(id);
            ui.setSelectedAnchorId(null);
          }}
          onEditingStateChange={ui.setIsEditingAnchor}
          isEditingAnchor={ui.isEditingAnchor}
        />
      </Canvas>

      <AnchorActionButtons
        isScanning={ui.isScanning}
        isRefreshing={ui.isRefreshing}
        onScanClick={handleScanButtonClick}
        onAddClick={() => {
          ui.setIsAddingMode(true);
          ui.setSelectedAnchorId(null);
          ui.setTempPosition(null);
          ui.setShowInputForm(false);
        }}
        disabled={ui.isAddingMode || !!ui.relocatingAnchorId}
      />

      {(ui.isAddingMode || ui.relocatingAnchorId) && (
        <>
          {ui.isAddingMode && ui.tempPosition && ui.showInputForm ? (
            <AnchorForm
              label={ui.newLabel}
              description={ui.newDescription}
              onLabelChange={ui.setNewLabel}
              onDescriptionChange={ui.setNewDescription}
              onSave={handleSaveNew}
              onCancel={ui.resetAddMode}
              onBackToLocation={() => ui.setShowInputForm(false)}
              isSaving={ui.isSaving}
              isComposing={ui.isComposing}
            />
          ) : (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-end pb-16 pointer-events-none">
              <button
                onClick={() => {
                  if (ui.relocatingAnchorId) {
                    ui.setRelocatingAnchorId(null);
                    fetchAnchors().catch(console.error);
                  } else {
                    ui.resetAddMode();
                  }
                }}
                className="absolute top-28 right-10 rounded-full bg-black/40 p-4.5 text-white backdrop-blur-3xl border border-white/10 hover:bg-slate-800 transition-all active:scale-90 pointer-events-auto shadow-2xl"
              >
                <X className="h-7 w-7" />
              </button>
              <div className="mb-12 pointer-events-none flex flex-col items-center gap-6">
                <div className="rounded-full bg-slate-950/60 px-10 py-5 text-white backdrop-blur-3xl border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.4)] animate-pulse">
                  <p className="flex items-center gap-4 font-black text-base tracking-[0.1em]">
                    {ui.isAddingMode ? (
                      ui.tempPosition ? "ドラッグで調整 → 離して確認" : "床をドラッグして位置を決定"
                    ) : (
                      "ドラッグで位置を変更 → 離して決定"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
