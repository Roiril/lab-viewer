"use client";

import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  Html,
  ContactShadows,
  PerspectiveCamera,
} from "@react-three/drei";
import { Loader2 } from "lucide-react";

// --- 設定 ---
// ★ここにSupabaseで取得したURLを貼り付けてください
const DEFAULT_MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sponza/glTF/Sponza.gltf"; 

// アンカーデータ（球＋テキスト）の定義
const INITIAL_ANCHORS = [
  { id: "1", position: [0, 1.5, 0] as [number, number, number], label: "実験デスク", color: "orange" },
  { id: "2", position: [2, 1.0, 1] as [number, number, number], label: "3Dプリンタ", color: "cyan" },
];

// --- 3Dコンポーネント ---

// 部屋モデル
const RoomModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.0} />;
};

// マーカー（球＋ラベル）
// 型定義をより明確にし、anyを回避
type AnchorData = {
  id: string;
  position: [number, number, number];
  label: string;
  color: string;
};

const AnchorMarker = ({ data }: { data: AnchorData }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={data.position}>
      <mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color={hovered ? "white" : data.color} emissive={data.color} emissiveIntensity={0.5} />
      </mesh>
      <Html position={[0, 0.4, 0]} center distanceFactor={10}>
        <div className="pointer-events-none rounded-md bg-black/70 px-2 py-1 text-sm text-white backdrop-blur-sm whitespace-nowrap">
          {data.label}
        </div>
      </Html>
    </group>
  );
};

// ローディング表示
const Loader = () => (
  <Html center>
    <div className="flex flex-col items-center text-white">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm mt-2 font-medium">Loading Space...</p>
    </div>
  </Html>
);

// --- メインページ ---
export default function Page() {
  return (
    <div className="h-screen w-full bg-slate-900">
      <Canvas shadows>
        {/* 俯瞰視点の設定 */}
        <PerspectiveCamera makeDefault position={[5, 8, 8]} fov={50} />
        
        <color attach="background" args={["#1e1e2e"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment preset="city" />

        <Suspense fallback={<Loader />}>
          <RoomModel url={DEFAULT_MODEL_URL} />
          {INITIAL_ANCHORS.map((anchor) => (
            <AnchorMarker key={anchor.id} data={anchor} />
          ))}
        </Suspense>

        {/* 操作制限: 地面に潜り込まないようにする */}
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.1} minDistance={2} maxDistance={20} />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={20} blur={2} />
      </Canvas>
      
      <div className="absolute top-4 left-4 text-white bg-black/50 p-4 rounded backdrop-blur-md">
        <h1 className="font-bold">Lab Viewer</h1>
        <p className="text-xs mt-1 opacity-80">左ドラッグ: 回転 / 右ドラッグ: 移動</p>
      </div>
    </div>
  );
}