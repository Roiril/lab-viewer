# Intent Layer - ラボビューアー

3D空間に意図を配置・管理するインタラクティブなビューアーアプリケーションです。

## 機能

- **3Dビューアー**: Three.jsを使用した3D空間の可視化
- **意図の配置**: 3D空間内の任意の位置に意図（アンカー）を配置
- **意図の管理**: 配置した意図の編集、削除、移動
- **スキャンモード**: 配置された意図を表示/非表示
- **リアルタイム同期**: Supabaseを使用したデータのリアルタイム同期

## 技術スタック

- **フレームワーク**: Next.js 16
- **3Dライブラリ**: Three.js, React Three Fiber, Drei
- **データベース**: Supabase
- **スタイリング**: Tailwind CSS 4
- **言語**: TypeScript
- **アイコン**: Lucide React

## セットアップ

### 必要な環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### インストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使用方法

1. **スキャンモード**: 右上の「スキャン」ボタンをクリックして、配置された意図を表示します
2. **意図の配置**: 右下の「意図を配置」ボタンをクリックし、3D空間内をドラッグして位置を決定します
3. **意図の編集**: スキャンモードで意図をクリックし、編集ボタンから内容を変更できます
4. **意図の移動**: 意図を選択し、「移動（長押し）」ボタンから位置を変更できます
5. **意図の削除**: 意図を選択し、削除ボタンから削除できます

## プロジェクト構造

```
lab-viewer/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx             # メインページ
│   └── globals.css         # グローバルスタイル
├── components/
│   ├── 3d/                 # 3Dコンポーネント
│   │   ├── RoomModel.tsx
│   │   ├── ClickableFloor.tsx
│   │   ├── AnchorMarker.tsx
│   │   └── PreviewMarker.tsx
│   └── ui/                 # UIコンポーネント
│       ├── Loader.tsx
│       └── ErrorToast.tsx
├── hooks/
│   └── useAnchors.ts       # アンカー管理フック
├── lib/
│   ├── supabase.ts         # Supabaseクライアント
│   └── constants.ts        # 定数
└── types/
    └── index.ts            # 型定義
```

## ビルド

```bash
npm run build
# または
yarn build
# または
pnpm build
```

## デプロイ

Vercelへのデプロイが最も簡単です：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/lab-viewer)

詳細は [Next.js デプロイメントドキュメント](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。

## ライセンス

このプロジェクトはプライベートプロジェクトです。
