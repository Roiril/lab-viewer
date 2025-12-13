"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  PerspectiveCamera,
  CameraControls,
} from "@react-three/drei";
import * as THREE from "three";
import { Loader2, Plus, X, Save, MapPin, Move, Scan, EyeOff } from "lucide-react";

import { RoomModel } from "@/components/3d/RoomModel";
import { ClickableFloor } from "@/components/3d/ClickableFloor";
import { AnchorMarker } from "@/components/3d/AnchorMarker";
import { PreviewMarker } from "@/components/3d/PreviewMarker";
import { Loader } from "@/components/ui/Loader";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { useAnchors } from "@/hooks/useAnchors";
import { DEFAULT_MODEL_URL, FIXED_HEIGHT } from "@/lib/constants";
import type { AnchorPoint } from "@/types";

export default function IntentLayerPage() {
  const [modelUrl] = useState(DEFAULT_MODEL_URL);
  const {
    anchors,
    fetchAnchors,
    createAnchor,
    updateAnchor,
    deleteAnchor,
    setAnchors,
  } = useAnchors();

  // モード管理
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [isEditingAnchor, setIsEditingAnchor] = useState(false);

  // 位置変更（リロケーション）モードの状態
  const [relocatingAnchorId, setRelocatingAnchorId] =
    useState<string | null>(null);

  // 新規入力用状態
  const [tempPosition, setTempPosition] = useState<
    [number, number, number] | null
  >(null);
  const [showInputForm, setShowInputForm] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isComposing = useRef(false);

  // スキャン開始時の再取得中フラグ
  const [isRefreshing, setIsRefreshing] = useState(false);

  // エラー表示用
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const controlsRef = useRef<CameraControls>(null);

  useEffect(() => {
    fetchAnchors().catch((err) => {
      setErrorMessage("アンカーの読み込みに失敗しました");
      console.error(err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAddingMode || relocatingAnchorId) {
      if (controlsRef.current) {
        controlsRef.current.setLookAt(0, 20, 6, 0, 0, 0, true);
      }
    }
  }, [isAddingMode, relocatingAnchorId]);

  // スキャンボタンの処理
  const handleScanButtonClick = async () => {
    if (isRefreshing) return;

    if (isScanning) {
      setIsScanning(false);
      setSelectedAnchorId(null);
      return;
    }

    try {
      setIsRefreshing(true);
      await fetchAnchors();
      setIsScanning(true);
    } catch (err) {
      setErrorMessage("アンカーの更新に失敗しました");
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFloorDragStart = (point: THREE.Vector3) => {
    const newPos: [number, number, number] = [point.x, FIXED_HEIGHT, point.z];

    if (isAddingMode) {
      setTempPosition(newPos);
      setShowInputForm(false);
    } else if (relocatingAnchorId) {
      setAnchors((prev) =>
        prev.map((a) =>
          a.id === relocatingAnchorId ? { ...a, position: newPos } : a
        )
      );
    }
  };

  const handleFloorDragMove = (point: THREE.Vector3) => {
    const newPos: [number, number, number] = [point.x, FIXED_HEIGHT, point.z];

    if (isAddingMode) {
      setTempPosition(newPos);
    } else if (relocatingAnchorId) {
      setAnchors((prev) =>
        prev.map((a) =>
          a.id === relocatingAnchorId ? { ...a, position: newPos } : a
        )
      );
    }
  };

  const handleFloorDragEnd = () => {
    if (isAddingMode) {
      if (tempPosition) {
        setShowInputForm(true);
      }
    } else if (relocatingAnchorId) {
      confirmRelocation();
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
      newCamPos.x,
      newCamPos.y,
      newCamPos.z,
      x,
      y,
      z,
      true
    );
  };

  const startRelocation = (id: string) => {
    const anchor = anchors.find((a) => a.id === id);
    if (anchor) {
      setRelocatingAnchorId(id);
      setSelectedAnchorId(null);
    }
  };

  const confirmRelocation = async () => {
    const idToUpdate = relocatingAnchorId;
    if (!idToUpdate) return;

    const anchor = anchors.find((a) => a.id === idToUpdate);
    if (!anchor) return;

    setRelocatingAnchorId(null);

    try {
      setIsSaving(true);
      await updateAnchor(idToUpdate, { position: anchor.position });
    } catch (err) {
      setErrorMessage("位置の更新に失敗しました");
      console.error(err);
      await fetchAnchors();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNew = async () => {
    if (!tempPosition || !newLabel || !newDescription) return;
    try {
      setIsSaving(true);
      await createAnchor({
        label: newLabel,
        description: newDescription,
        color: "lime",
        position: tempPosition,
      });
      resetAddMode();
      setIsScanning(true);
    } catch (err) {
      setErrorMessage("保存に失敗しました");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAddMode = () => {
    setIsAddingMode(false);
    setTempPosition(null);
    setShowInputForm(false);
    setNewLabel("");
    setNewDescription("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この意図を削除しますか？")) return;

    try {
      await deleteAnchor(id);
      setSelectedAnchorId(null);
    } catch (err) {
      setErrorMessage("削除に失敗しました");
      console.error(err);
    }
  };

  const handleUpdateContent = async (
    id: string,
    label: string,
    description: string,
    position: [number, number, number]
  ) => {
    if (!description.trim()) {
      setErrorMessage("意図は必須です");
      return;
    }

    try {
      await updateAnchor(id, { label, description, position });
    } catch (err) {
      setErrorMessage("更新に失敗しました");
      console.error(err);
      await fetchAnchors();
    }
  };

  const stopInputPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
  };

  return (
    <div
      className="relative h-[100dvh] w-full bg-slate-950 text-white overflow-hidden select-none"
      style={{ touchAction: "none" }}
    >
      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      <div className="absolute top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none">
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
          <h1 className="text-lg font-bold tracking-tight text-white/90">
            Intent Layer
          </h1>
          <div className="h-4 w-px bg-white/20" />
          <div
            className={`w-2 h-2 rounded-full ${
              isScanning
                ? "bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                : "bg-slate-600"
            }`}
          />
        </div>
      </div>

      <Canvas
        shadows
        className={
          isAddingMode || relocatingAnchorId ? "cursor-grabbing" : "cursor-default"
        }
      >
        <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={45} />
        <color attach="background" args={["#0a0a0c"]} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <Environment preset="night" />

        <Suspense fallback={<Loader />}>
          <group>
            <RoomModel url={modelUrl} />

            <ClickableFloor
              isAddingMode={isAddingMode}
              isRelocating={!!relocatingAnchorId}
              onDragStart={handleFloorDragStart}
              onDragMove={handleFloorDragMove}
              onDragEnd={handleFloorDragEnd}
              onDeselect={() => {
                if (!relocatingAnchorId && !isAddingMode)
                  setSelectedAnchorId(null);
              }}
            />

            {isScanning &&
              anchors.map((anchor) => (
                <AnchorMarker
                  key={anchor.id}
                  data={anchor}
                  isSelected={selectedAnchorId === anchor.id}
                  isRelocating={relocatingAnchorId === anchor.id}
                  onSelect={() => {
                    if (!relocatingAnchorId && !isAddingMode) {
                      setSelectedAnchorId(anchor.id);
                      focusOnAnchor(anchor.position);
                    }
                  }}
                  onDelete={handleDelete}
                  onUpdate={handleUpdateContent}
                  onStartRelocation={startRelocation}
                  onEditingStateChange={setIsEditingAnchor}
                />
              ))}

            {isAddingMode && tempPosition && (
              <PreviewMarker position={tempPosition} isVisible={true} />
            )}
          </group>
        </Suspense>

        <CameraControls
          ref={controlsRef}
          makeDefault
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2}
          maxDistance={30}
          enabled={!isAddingMode && !relocatingAnchorId && !isEditingAnchor}
          dollySpeed={0.8}
          truckSpeed={0.8}
          smoothTime={0.25}
        />
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.4}
          scale={30}
          blur={2}
          far={4}
        />
      </Canvas>

      {!isAddingMode && !relocatingAnchorId && (
        <div className="absolute bottom-8 left-0 right-0 z-[100] flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-2xl">
            <button
              onClick={handleScanButtonClick}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 ${
                isScanning
                  ? "bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)] scale-105"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5"
              } ${isRefreshing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isRefreshing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isScanning ? (
                <Scan className="w-5 h-5 animate-pulse" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
              <span className="text-sm">
                {isRefreshing ? "更新中" : isScanning ? "スキャン中" : "スキャン"}
              </span>
            </button>

            <button
              onClick={() => {
                setIsAddingMode(true);
                setSelectedAnchorId(null);
                setTempPosition(null);
                setShowInputForm(false);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg shadow-blue-900/40 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all font-bold"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">意図を配置</span>
            </button>
          </div>
        </div>
      )}

      {(isAddingMode || relocatingAnchorId) && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-end pb-8 pointer-events-none">
          <button
            onClick={() => {
              if (relocatingAnchorId) {
                setRelocatingAnchorId(null);
                fetchAnchors().catch((err) => {
                  setErrorMessage("アンカーの読み込みに失敗しました");
                  console.error(err);
                });
              } else {
                resetAddMode();
              }
            }}
            className="absolute top-24 right-6 rounded-full bg-black/50 p-3 text-white backdrop-blur-md border border-white/10 hover:bg-slate-800 transition-colors pointer-events-auto"
          >
            <X className="h-6 w-6" />
          </button>

          {isAddingMode && tempPosition && showInputForm ? (
            <div className="w-[90%] max-w-sm rounded-3xl bg-slate-900/95 p-5 shadow-2xl border border-slate-700 backdrop-blur-xl animate-in slide-in-from-bottom-20 duration-300 pointer-events-auto">
              <div className="flex items-center gap-2 mb-3 text-lime-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-bold">位置を決定しました</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    名前
                  </label>
                  <input
                    autoFocus
                    type="text"
                    onCompositionStart={() => {
                      isComposing.current = true;
                    }}
                    onCompositionEnd={() => {
                      isComposing.current = false;
                    }}
                    onPointerDown={stopInputPropagation}
                    onKeyDown={(e) =>
                      !isComposing.current && stopInputPropagation(e)
                    }
                    onKeyUp={stopInputPropagation}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600 mb-2.5"
                    placeholder="名前を入力..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />

                  <label className="block text-[10px] font-bold text-lime-400 mb-1.5 uppercase tracking-wider">
                    意図 (必須)
                  </label>
                  <textarea
                    onCompositionStart={() => {
                      isComposing.current = true;
                    }}
                    onCompositionEnd={() => {
                      isComposing.current = false;
                    }}
                    onPointerDown={stopInputPropagation}
                    onKeyDown={(e) =>
                      !isComposing.current && stopInputPropagation(e)
                    }
                    onKeyUp={stopInputPropagation}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600 resize-none min-h-[60px]"
                    placeholder="周りの人に伝えたいことを入力, ex「集中してるので今はしゃべりかけないで」「作業中だけど雑談歓迎だよ」etc"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowInputForm(false);
                    }}
                    onPointerDown={stopInputPropagation}
                    className="flex-1 rounded-lg bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    位置を直す
                  </button>
                  <button
                    onClick={handleSaveNew}
                    onPointerDown={stopInputPropagation}
                    disabled={!newLabel || !newDescription || isSaving}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    保存する
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-10 pointer-events-none flex flex-col items-center gap-4">
              <div className="rounded-full bg-slate-900/80 px-6 py-3 text-white backdrop-blur-md border border-white/10 shadow-2xl animate-pulse">
                <p className="flex items-center gap-2 font-bold text-xs">
                  <Move className="h-4 w-4 text-lime-400" />
                  {isAddingMode
                    ? tempPosition
                      ? "ドラッグで移動 → 離して決定"
                      : "画面をタッチ＆ドラッグして配置"
                    : "ドラッグで移動 → 離して決定"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
