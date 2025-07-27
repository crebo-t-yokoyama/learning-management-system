# 技術スタック詳細

## 📦 パッケージ構成

### フロントエンド Core
```json
{
  "next": "^15.x",
  "react": "^18.x",
  "typescript": "^5.x"
}
```

### UI・スタイリング
```json
{
  "@radix-ui/react-*": "shadcn/ui dependencies",
  "tailwindcss": "^3.x",
  "lucide-react": "アイコン"
}
```

### 認証・データベース
```json
{
  "next-auth": "Auth.js",
  "@supabase/supabase-js": "Supabase client",
  "@auth/supabase-adapter": "Auth.js Supabase adapter"
}
```

### 開発・品質
```json
{
  "@biomejs/biome": "リンター・フォーマッター",
  "zod": "バリデーション",
  "vitest": "ユニットテスト",
  "@playwright/test": "E2Eテスト"
}
```

## 🛠 開発ツール

### エディタ設定
- **VSCode推奨**: 設定ファイル完備
- **Biome extension**: 自動フォーマット
- **TypeScript**: IntelliSense有効

### パッケージマネージャ
- **pnpm**: パフォーマンス・ディスク効率
- **lock file**: `pnpm-lock.yaml`で依存関係固定

## 🔧 ビルド・最適化

### Next.js設定
- **App Router**: ファイルベースルーティング
- **Server Components**: デフォルト
- **Image Optimization**: `next/image`
- **Font Optimization**: `next/font`

### Tailwind CSS
- **JIT Mode**: オンデマンドCSS生成
- **Purge**: 未使用スタイル削除
- **Dark Mode**: クラスベース対応準備

## 📊 監視・ログ

### 標準実装
- **Next.js Analytics**: Vercel Analytics
- **Console Logging**: 開発用

### オプション
- **Sentry**: エラー監視
- **PostHog**: ユーザー行動分析

## 🔄 状態管理

### 基本方針
- **Server State**: Supabase + React Query (TanStack Query)
- **Client State**: React useState/useReducer
- **Global State**: Jotai（必要時のみ）

### 推奨パターン
```typescript
// Server Components for data fetching
async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}

// Client Components for interactivity
function ClientComponent({ data }) {
  const [state, setState] = useState(data)
  // ...
}
```

## 🎨 デザインシステム

### shadcn/ui
- **コンポーネント**: `src/components/ui/`
- **テーマ**: CSS Variables
- **カスタマイズ**: `tailwind.config.ts`

### アイコン
- **Lucide React**: 統一されたアイコンセット
- **カスタムアイコン**: SVGコンポーネント

## 🧪 テスト戦略

### ユニットテスト (Vitest)
- **対象**: ユーティリティ関数、hooks
- **設定**: `vitest.config.ts`
- **カバレッジ**: 80%以上目標

### E2Eテスト (Playwright)
- **対象**: ユーザーフロー
- **設定**: `playwright.config.ts`
- **並列実行**: 高速化対応

## 📱 レスポンシブ対応

### ブレイクポイント
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### アプローチ
- **Mobile First**: モバイル優先設計
- **Progressive Enhancement**: 段階的機能向上
- **Touch Friendly**: タッチ操作対応