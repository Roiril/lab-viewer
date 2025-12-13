// アンカーポイントの型定義
export type AnchorPoint = {
  id: string;
  position: [number, number, number];
  label: string;
  description: string;
  color: string;
};

// Supabaseから取得するアンカーデータの型
export type AnchorRow = {
  id: string;
  position_x: number;
  position_y: number;
  position_z: number;
  label: string;
  description: string;
  color: string;
};

