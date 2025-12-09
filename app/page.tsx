"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Html,
  ContactShadows,
  PerspectiveCamera,
  CameraControls,
} from "@react-three/drei";
import * as THREE from "three";
import { Loader2, Plus, X, Save, MapPin, Trash2, Edit2, Check } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// --- Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

// 床コンポーネント
const ClickableFloor = ({ 
  isAddingMode, 
  onPositionUpdate, 
  onDragStart, 
  onDragEnd,
  onDeselect
}: { 
  isAddingMode: boolean;
  onPositionUpdate: (point: THREE.Vector3) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDeselect: () => void;
}) => {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      onPointerDown={(e) => {
        if (isAddingMode) {
          e.stopPropagation();
          onDragStart(); 
          onPositionUpdate(e.point);
        } else {
          onDeselect();
        }
      }}
      onPointerMove={(e) => {
        if (isAddingMode && e.buttons === 1) {
          e.stopPropagation();
          onPositionUpdate(e.point);
        }
      }}
      onPointerUp={(e) => {
        if (isAddingMode) {
          e.stopPropagation();
          onDragEnd(); 
        }
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={true} />
    </mesh>
  );
};

// アンカーマーカー
const AnchorMarker = ({ 
  data, 
  isSelected, 
  onSelect, 
  onDelete,
  onUpdate,
  onPositionChange,
  onDragStart,
  onDragEnd
}: { 
  data: AnchorPoint; 
  isSelected: boolean; 
  onSelect: () => void; 
  onDelete: (id: string) => void;
  onUpdate: (id: string, newLabel: string, newDescription: string, newPosition: [number, number, number]) => void;
  onPositionChange: (id: string, newPosition: THREE.Vector3) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const [editDescription, setEditDescription] = useState(data.description || "");
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
      setEditLabel(data.label);
      setEditDescription(data.description || "");
    }
    if (!isDragging.current) {
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

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!isSelected) {
        onSelect();
    }
    if (isSelected) {
        isDragging.current = true;
        onDragStart();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging.current && isSelected) {
      e.stopPropagation();
      const newPos = new THREE.Vector3(e.point.x, FIXED_HEIGHT, e.point.z);
      onPositionChange(data.id, newPos);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging.current) {
        e.stopPropagation();
        isDragging.current = false;
        onDragEnd();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  return (
    <group position={data.position}>
      {/* 球体 */}
      <mesh 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => isSelected && (document.body.style.cursor = 'grab')}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? "white" : data.color}
          emissive={isSelected ? "white" : data.color}
          emissiveIntensity={isSelected ? 0.8 : 0.5}
        />
      </mesh>

      {/* 非選択時のラベル */}
      {!isSelected && (
        <Html 
            position={[0, 0.25, 0]} 
            center 
            distanceFactor={10} // 少し遠く見せる調整
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

      {/* 詳細UI: デザイン調整済み */}
      {isSelected && !isDragging.current && (
        <Html 
            position={[0, 0.3, 0]} // 球体に近い位置に
            center 
            distanceFactor={5} // 値を大きくして、表示サイズを小さくする
            style={{ pointerEvents: 'auto' }} 
            zIndexRange={[100, 0]}
        >
          <div 
            className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* カード本体: 幅を固定してコンパクトに */}
            <div className="relative flex flex-col rounded-lg bg-slate-950/90 p-3 text-white shadow-2xl backdrop-blur-md border border-white/10 w-[220px]">
              
              {/* 吹き出しの三角 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-950/90"></div>

              {isEditing ? (
                // --- 編集モード ---
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] text-blue-300 text-center font-bold">
                     ドラッグで移動可能
                  </p>
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
                    <Check className="w-3 h-3" />
                    <span className="text-[10px] font-bold">保存</span>
                  </button>
                </div>
              ) : (
                // --- 閲覧モード ---
                <div className="flex flex-col w-full">
                  {/* ヘッダー: ラベル */}
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)] flex-shrink-0"></div>
                    <span className="text-sm font-bold text-white truncate">
                      {data.label}
                    </span>
                  </div>

                  {/* 本文: 説明 */}
                  <div className="mb-3">
                    <p className="text-xs text-slate-300 whitespace-pre-wrap break-words leading-5">
                      {data.description}
                    </p>
                  </div>
                  
                  {/* フッター: アクション */}
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-white/5">
                    <button 
                      onClick={handleEditStart}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="編集"
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
              )}
            </div>
          </div>
        </Html>
      )}
      
      {/* 地面への線 */}
      <mesh position={[0, -data.position[1] / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, data.position[1], 8]} />
        <meshBasicMaterial color={data.color} opacity={0.5} transparent />
      </mesh>
    </group>
  );
};

// プレビューマーカー
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
      
      <mesh position={[0, -position[1] + 0.01, 0]} rotation={[-Math.PI/2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.1, 0.15, 32]} />
        <meshBasicMaterial color="lime" side={THREE.DoubleSide} />
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

// --- メインページ ---

export default function IntentLayerPage() {
  const [modelUrl] = useState(DEFAULT_MODEL_URL);
  const [anchors, setAnchors] = useState<AnchorPoint[]>([]);
  
  // モード・選択状態
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  
  // 入力用状態
  const [tempPosition, setTempPosition] = useState<[number, number, number] | null>(null);
  const [showInputForm, setShowInputForm] = useState(false); 
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // カメラコントロールの参照
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
    setTempPosition([point.x, FIXED_HEIGHT, point.z]);
  };

  const handleAnchorPositionChange = (id: string, newPosition: THREE.Vector3) => {
    setAnchors(prev => prev.map(a => 
        a.id === id ? { ...a, position: [newPosition.x, FIXED_HEIGHT, newPosition.z] } : a
    ));
  };

  const handleAnchorDragStart = () => setIsDraggingAnchor(true);
  const handleAnchorDragEnd = () => setIsDraggingAnchor(false);

  // カメラを指定のアンカー位置にフォーカスさせる関数
  const focusOnAnchor = (position: [number, number, number]) => {
    if (!controlsRef.current) return;
    
    const [x, y, z] = position;
    const camera = controlsRef.current.camera;
    const currentPos = camera.position;
    const targetV = new THREE.Vector3(x, y, z);
    
    // ターゲットからカメラへのベクトル
    const direction = new THREE.Vector3().subVectors(currentPos, targetV).normalize();
    
    // 距離を3.5mに設定
    const dist = 3.5;
    const newCamPos = targetV.clone().add(direction.multiplyScalar(dist));
    
    if (newCamPos.y < 1.0) newCamPos.y = 1.0;

    controlsRef.current.setLookAt(
        newCamPos.x, newCamPos.y, newCamPos.z,
        x, y, z,
        true 
    );
  };

  const handleSave = async () => {
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
      alert("削除に失敗しました。ポリシーを確認してください。");
    }
  };

  const handleUpdate = async (id: string, label: string, description: string, position: [number, number, number]) => {
    try {
      const { error } = await supabase
        .from('anchors')
        .update({ 
            label, 
            description,
            position_x: position[0],
            position_y: position[1],
            position_z: position[2]
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setAnchors(anchors.map(a => 
        a.id === id ? { ...a, label, description, position } : a
      ));
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました。ポリシーを確認してください。");
      fetchAnchors(); 
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-slate-950 text-white overflow-hidden touch-action-none select-none">
      
      {/* ヘッダー (Z-indexを高く設定) */}
      <div className="absolute top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none">
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
          <h1 className="text-lg font-bold tracking-tight text-white/90">Intent Layer</h1>
          <div className="h-4 w-px bg-white/20" />
          <div className={`w-2 h-2 rounded-full ${isAddingMode ? 'bg-lime-400 animate-pulse' : 'bg-blue-500'}`} />
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows className={isAddingMode || isDraggingAnchor ? "cursor-move" : "cursor-default"}>
        <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={45} />
        <color attach="background" args={["#0a0a0c"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
        <Environment preset="night" />

        <Suspense fallback={<Loader />}>
          <group>
            <RoomModel url={modelUrl} />
            
            <ClickableFloor 
              isAddingMode={isAddingMode} 
              onPositionUpdate={handlePositionUpdate}
              onDragStart={() => setShowInputForm(false)} 
              onDragEnd={() => setShowInputForm(true)}    
              onDeselect={() => !isDraggingAnchor && setSelectedAnchorId(null)}
            />
            
            {anchors.map((anchor) => (
              <AnchorMarker 
                key={anchor.id} 
                data={anchor} 
                isSelected={selectedAnchorId === anchor.id}
                onSelect={() => {
                    setSelectedAnchorId(anchor.id);
                    focusOnAnchor(anchor.position);
                }}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onPositionChange={handleAnchorPositionChange}
                onDragStart={handleAnchorDragStart}
                onDragEnd={handleAnchorDragEnd}
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
          enabled={!isAddingMode && !isDraggingAnchor} 
          dollySpeed={0.8}
          truckSpeed={0.8}
          smoothTime={0.25} 
        />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={30} blur={2} far={4} />
      </Canvas>

      {/* UIレイヤー */}

      {!isAddingMode && (
        <div className="absolute bottom-8 left-0 right-0 z-[100] flex justify-center pointer-events-none">
          <button
            onClick={() => {
              setIsAddingMode(true);
              setSelectedAnchorId(null);
            }}
            className="pointer-events-auto flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95 transition-all font-bold"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">意図を配置する</span>
          </button>
        </div>
      )}

      {/* 入力フォーム */}
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
                    onClick={handleSave}
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