"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Html,
  ContactShadows,
  PerspectiveCamera,
  CameraControls,
} from "@react-three/drei";
import * as THREE from "three";
import { Loader2, Plus, X, Save, MapPin, Trash2, Edit2, Move, Scan, EyeOff } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// --- Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase API Keys are missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// --- 型定義 ---
type AnchorPoint = {
  id: string;
  position: [number, number, number];
  label: string;
  description: string;
  color: string;
};

// --- 定数 ---
const DEFAULT_MODEL_URL = "https://jrwhqtiruhydherhwkqc.supabase.co/storage/v1/object/public/room-models/LabMesh.glb";
const FIXED_HEIGHT = 1.5;

// --- 3Dコンポーネント ---

const RoomModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.0} position={[0, 0, 0]} />;
};

const ClickableFloor = ({
  isActive,
  onPositionUpdate,
  onDragStart,
  onDragEnd,
  onDeselect
}: {
  isActive: boolean;
  onPositionUpdate: (point: THREE.Vector3) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDeselect: () => void;
}) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      visible={false} 
      onPointerDown={(e) => {
        if (isActive) {
          e.stopPropagation();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onDragStart();
          onPositionUpdate(e.point);
        } else {
          onDeselect();
        }
      }}
      onPointerMove={(e) => {
        if (isActive && e.buttons === 1) {
          e.stopPropagation();
          onPositionUpdate(e.point);
        }
      }}
      onPointerUp={(e) => {
        if (isActive) {
          e.stopPropagation();
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
          onDragEnd();
        }
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
};

// アンカーマーカー
const AnchorMarker = ({
  data,
  isSelected,
  isRelocating,
  onSelect,
  onDelete,
  onUpdate,
  onStartRelocation
}: {
  data: AnchorPoint;
  isSelected: boolean;
  isRelocating: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newLabel: string, newDescription: string, newPosition: [number, number, number]) => void;
  onStartRelocation: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const [editDescription, setEditDescription] = useState(data.description || "");

  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
      setEditLabel(data.label);
      setEditDescription(data.description || "");
    }
  }, [isSelected, data.label, data.description]);

  const handleUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editDescription.trim()) {
      alert("意図は必須です");
      return;
    }
    onUpdate(data.id, editLabel, editDescription, data.position);
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(data.id);
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleRelocationStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    onStartRelocation(data.id);
  };

  return (
    <group position={data.position}>
      {/* 球体 */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (!isRelocating) onSelect();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        raycast={isRelocating ? () => null : THREE.Mesh.prototype.raycast}
        onPointerOver={() => !isRelocating && isSelected && (document.body.style.cursor = 'pointer')}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial
          color={isRelocating ? "lime" : (isSelected ? "white" : data.color)}
          emissive={isRelocating ? "lime" : (isSelected ? "white" : data.color)}
          emissiveIntensity={isRelocating ? 0.8 : (isSelected ? 0.8 : 0.5)}
        />
      </mesh>

      {/* 非選択時のラベル */}
      {!isSelected && !isRelocating && (
        <Html
          position={[0, 0.25, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[0, 50]}
        >
          <div className="flex justify-center">
            <div className="bg-black/40 backdrop-blur-[2px] px-2 py-0.5 rounded text-[10px] text-white/90 font-medium whitespace-nowrap border border-white/10 shadow-sm">
              {data.label}
            </div>
          </div>
        </Html>
      )}

      {/* 詳細UI */}
      {isSelected && !isRelocating && (
        <Html
          position={[0, 0.3, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: 'auto' }}
          zIndexRange={[100, 0]}
        >
          <div
            className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-col rounded-lg bg-slate-950/90 p-3 text-white shadow-2xl backdrop-blur-md border border-white/10 w-[220px]">
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-950/90"></div>

              {isEditing ? (
                // 編集モード
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] text-slate-400 text-center font-bold">内容を編集</p>
                  <div>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full bg-slate-800 rounded px-2 py-1 text-xs text-white border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                      placeholder="名前"
                    />
                  </div>
                  <div>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-800 rounded px-2 py-1 text-xs text-white border border-slate-700 focus:outline-none focus:border-blue-500 min-h-[50px] resize-none leading-relaxed placeholder:text-slate-600"
                      placeholder="意図を入力..."
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleUpdate}
                    disabled={!editDescription.trim()}
                    className="w-full py-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 rounded text-white transition-colors flex items-center justify-center gap-1 mt-0.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="text-[10px] font-bold">内容を保存</span>
                  </button>
                </div>
              ) : (
                // 閲覧モード
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)] flex-shrink-0"></div>
                    <span className="text-sm font-bold text-white truncate">
                      {data.label}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-slate-300 whitespace-pre-wrap break-words leading-5">
                      {data.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <button
                      onPointerDown={handleRelocationStart}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-800 hover:bg-blue-600 text-[10px] text-slate-300 hover:text-white transition-colors border border-white/5 cursor-grab active:cursor-grabbing"
                    >
                      <Move className="w-3 h-3" />
                      <span>移動（長押し）</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleEditStart}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="内容を編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="削除"
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

      {/* 地面への線 */}
      <mesh position={[0, -data.position[1] / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, data.position[1], 8]} />
        <meshBasicMaterial color={isRelocating ? "lime" : data.color} opacity={0.5} transparent />
      </mesh>

      {/* 移動モード時の着地点ガイド */}
      {isRelocating && (
        <mesh position={[0, -data.position[1] + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.25, 32]} />
          <meshBasicMaterial color="lime" side={THREE.DoubleSide} opacity={0.6} transparent />
        </mesh>
      )}
    </group>
  );
};

const PreviewMarker = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial color="lime" emissive="lime" emissiveIntensity={0.8} />
      </mesh>
      <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-bold text-lime-400 bg-black/70 px-1.5 py-0.5 rounded border border-lime-400/30 whitespace-nowrap shadow-lg">
          新規配置
        </div>
      </Html>
      <mesh position={[0, -position[1] / 2, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.015, 0.015, position[1], 8]} />
        <meshBasicMaterial color="lime" opacity={0.6} transparent />
      </mesh>
    </group>
  );
};

const Loader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-2 text-white pointer-events-none">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm font-medium">読み込み中...</p>
    </div>
  </Html>
);

export default function IntentLayerPage() {
  const [modelUrl] = useState(DEFAULT_MODEL_URL);
  const [anchors, setAnchors] = useState<AnchorPoint[]>([]);

  // モード管理
  const [isScanning, setIsScanning] = useState(false); // スキャン（可視化）モードの状態
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);

  // 位置変更（リロケーション）モードの状態
  const [relocatingAnchorId, setRelocatingAnchorId] = useState<string | null>(null);
  const [originalPosition, setOriginalPosition] = useState<[number, number, number] | null>(null);

  // 新規入力用状態
  const [tempPosition, setTempPosition] = useState<[number, number, number] | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const controlsRef = useRef<CameraControls>(null);

  useEffect(() => {
    fetchAnchors();
  }, []);

  const fetchAnchors = async () => {
    try {
      const { data } = await supabase.from('anchors').select('*');
      if (data) {
        setAnchors(data.map((item: any) => ({
          id: item.id,
          position: [item.position_x, item.position_y, item.position_z],
          label: item.label,
          description: item.description,
          color: item.color || 'orange'
        })));
      }
    } catch (err) { console.error(err); }
  };

  const handlePositionUpdate = (point: THREE.Vector3) => {
    const newPos: [number, number, number] = [point.x, FIXED_HEIGHT, point.z];
    if (isAddingMode) {
      setTempPosition(newPos);
    } else if (relocatingAnchorId) {
      setAnchors(prev => prev.map(a =>
        a.id === relocatingAnchorId ? { ...a, position: newPos } : a
      ));
    }
  };

  const handleDragStart = () => {
    if (isAddingMode) setShowInputForm(false);
  };

  const handleDragEnd = () => {
    if (isAddingMode) {
      setShowInputForm(true);
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
    const direction = new THREE.Vector3().subVectors(currentPos, targetV).normalize();
    const dist = 5;
    const newCamPos = targetV.clone().add(direction.multiplyScalar(dist));
    if (newCamPos.y < 1.0) newCamPos.y = 1.0;

    controlsRef.current.setLookAt(
      newCamPos.x, newCamPos.y, newCamPos.z,
      x, y, z,
      true
    );
  };

  const startRelocation = (id: string) => {
    const anchor = anchors.find(a => a.id === id);
    if (anchor) {
      setOriginalPosition(anchor.position);
      setRelocatingAnchorId(id);
      setSelectedAnchorId(null);

      if (controlsRef.current) {
        controlsRef.current.setLookAt(
          5, 10, 5, // カメラ位置 (全体が見える高めの位置)
          0, 0, 0,    // 注視点 (部屋の中心)
          true        // スムーズなアニメーション
        );
      }
    }
  };

  const confirmRelocation = async () => {
    const idToUpdate = relocatingAnchorId;
    if (!idToUpdate) return;
    
    const anchor = anchors.find(a => a.id === idToUpdate);
    if (!anchor) return;

    // 楽観的UI更新: 即座にモードを解除
    setRelocatingAnchorId(null);
    setOriginalPosition(null);

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('anchors')
        .update({
          position_x: anchor.position[0],
          position_y: anchor.position[1],
          position_z: anchor.position[2]
        })
        .eq('id', idToUpdate);

      if (error) throw error;
    } catch (e) {
      console.error(e);
      alert("位置の更新に失敗しました。リロードしてください。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNew = async () => {
    if (!tempPosition || !newLabel || !newDescription) return;
    try {
      setIsSaving(true);
      const newAnchor = {
        label: newLabel,
        description: newDescription,
        color: 'lime',
        position_x: tempPosition[0],
        position_y: tempPosition[1],
        position_z: tempPosition[2]
      };
      const { data, error } = await supabase.from('anchors').insert([newAnchor]).select();
      if (error) throw error;
      if (data) {
        setAnchors([...anchors, {
          id: data[0].id,
          position: [data[0].position_x, data[0].position_y, data[0].position_z],
          label: data[0].label,
          description: data[0].description,
          color: data[0].color
        }]);
      }
      resetAddMode();
      // 追加後に自動的にスキャンモードをONにする（意図が見えるようにする）
      setIsScanning(true);
    } catch (e) {
      console.error(e);
      alert("保存エラー: " + (e as any).message);
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
      const { error } = await supabase.from('anchors').delete().eq('id', id);
      if (error) throw error;
      setAnchors(anchors.filter(a => a.id !== id));
      setSelectedAnchorId(null);
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました。");
    }
  };

  const handleUpdateContent = async (id: string, label: string, description: string, position: [number, number, number]) => {
    try {
      const { error } = await supabase
        .from('anchors')
        .update({ label, description })
        .eq('id', id);
      if (error) throw error;

      setAnchors(anchors.map(a =>
        a.id === id ? { ...a, label, description, position } : a
      ));
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました。");
      fetchAnchors();
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-slate-950 text-white overflow-hidden touch-action-none select-none">
      <div className="absolute top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none">
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
          <h1 className="text-lg font-bold tracking-tight text-white/90">Intent Layer</h1>
          <div className="h-4 w-px bg-white/20" />
          <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-slate-600'}`} />
        </div>
      </div>

      <Canvas shadows className={isAddingMode || relocatingAnchorId ? "cursor-grabbing" : "cursor-default"}>
        <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={45} />
        <color attach="background" args={["#0a0a0c"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
        <Environment preset="night" />

        <Suspense fallback={<Loader />}>
          <group>
            <RoomModel url={modelUrl} />
            <ClickableFloor
              isActive={isAddingMode || !!relocatingAnchorId}
              onPositionUpdate={handlePositionUpdate}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDeselect={() => {
                if (!relocatingAnchorId) setSelectedAnchorId(null);
              }}
            />
            {/* スキャンモードがONの時のみアンカーを表示 */}
            {isScanning && anchors.map((anchor) => (
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
              />
            ))}
            {isAddingMode && tempPosition && (
              <PreviewMarker position={tempPosition} />
            )}
          </group>
        </Suspense>

        <CameraControls
          ref={controlsRef}
          makeDefault
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2}
          maxDistance={30}
          enabled={!isAddingMode && !relocatingAnchorId}
          dollySpeed={0.8}
          truckSpeed={0.8}
          smoothTime={0.25}
        />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={30} blur={2} far={4} />
      </Canvas>

      {!isAddingMode && !relocatingAnchorId && (
        <div className="absolute bottom-8 left-0 right-0 z-[100] flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-2xl">
            {/* スキャン切り替えボタン */}
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 ${
                isScanning 
                  ? "bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)] scale-105" 
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5"
              }`}
            >
              {isScanning ? <Scan className="w-5 h-5 animate-pulse" /> : <EyeOff className="w-5 h-5" />}
              <span className="text-sm">{isScanning ? "スキャン中" : "スキャン"}</span>
            </button>

            {/* 配置ボタン */}
            <button
              onClick={() => {
                setIsAddingMode(true);
                setSelectedAnchorId(null);
                // 配置モードに入る際、必要ならスキャンをONにするか、そのままにするか。
                // ここでは既存の意図と重ならないように確認したければユーザーがスキャンを押すという設計にします。
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg shadow-blue-900/40 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all font-bold"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">意図を配置</span>
            </button>
          </div>
        </div>
      )}

      {relocatingAnchorId && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-end pb-8 pointer-events-none">
          <div className="absolute top-24 rounded-full bg-orange-600/80 px-6 py-3 text-white backdrop-blur-md border border-orange-400/30 animate-pulse shadow-xl">
            <p className="text-sm font-bold flex items-center gap-2">
              <Move className="w-4 h-4" />
              ドラッグして移動 → 離して決定
            </p>
          </div>
        </div>
      )}

      {isAddingMode && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-end pb-8 pointer-events-none">
          <button
            onClick={resetAddMode}
            className="absolute top-24 right-6 rounded-full bg-black/50 p-3 text-white backdrop-blur-md border border-white/10 hover:bg-slate-800 transition-colors pointer-events-auto"
          >
            <X className="h-6 w-6" />
          </button>

          {tempPosition && showInputForm ? (
            <div className="w-[90%] max-w-sm rounded-3xl bg-slate-900/95 p-5 shadow-2xl border border-slate-700 backdrop-blur-xl animate-in slide-in-from-bottom-20 duration-300 pointer-events-auto">
              <div className="flex items-center gap-2 mb-3 text-lime-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-bold">位置を決定</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">名前</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600 mb-2.5"
                    placeholder="名前を入力..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />

                  <label className="block text-[10px] font-bold text-lime-400 mb-1.5 uppercase tracking-wider">意図 (必須)</label>
                  <textarea
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600 resize-none min-h-[60px]"
                    placeholder="意図を入力..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setTempPosition(null);
                      setShowInputForm(false);
                    }}
                    className="flex-1 rounded-lg bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    位置を直す
                  </button>
                  <button
                    onClick={handleSaveNew}
                    disabled={!newLabel || !newDescription || isSaving}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    保存する
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-full bg-slate-900/80 px-6 py-3 text-white backdrop-blur-md border border-white/10 shadow-2xl animate-pulse pointer-events-none mb-10">
              <p className="flex items-center gap-2 font-bold text-xs">
                <MapPin className="h-4 w-4 text-lime-400" />
                タップまたはドラッグで配置
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}