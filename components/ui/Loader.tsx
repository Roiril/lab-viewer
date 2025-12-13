"use client";

import { Html } from "@react-three/drei";
import { Loader2 } from "lucide-react";

export const Loader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-2 text-white pointer-events-none">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm font-medium">読み込み中...</p>
    </div>
  </Html>
);

