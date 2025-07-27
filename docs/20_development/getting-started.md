# 開発環境セットアップ

## 📋 前提条件

### 必須ソフトウェア
- **Node.js**: v20.0.0以上
- **pnpm**: v8.0.0以上
- **Git**: v2.30.0以上

### 推奨開発環境
- **OS**: Windows 11, macOS 13+, Ubuntu 22.04+
- **エディタ**: Visual Studio Code
- **ブラウザ**: Chrome/Firefox最新版

### アカウント必要サービス
- **Supabase**: データベース・認証
- **Vercel**: デプロイ（オプション）

## 🚀 クイックスタート

### 1. リポジトリクローン
```bash
# テンプレートからプロジェクト作成
git clone https://github.com/your-org/nextjs-template.git my-project
cd my-project

# または、このテンプレートを使用して新規作成
npx create-next-app@latest my-project --template=this-template
```

### 2. 依存関係インストール
```bash
# pnpmが未インストールの場合
npm install -g pnpm

# パッケージインストール
pnpm install
```

### 3. 環境変数設定
```bash
# 環境変数ファイル作成
cp .env.example .env.local

# .env.local を編集（後述の設定ガイド参照）
vim .env.local
```

### 4. データベースセットアップ
```bash
# Supabaseプロジェクト作成（初回のみ）
# ブラウザでSupabaseダッシュボードからプロジェクト作成

# または、Claude Code + MCP Serverで作成
# Claude Codeに「Supabaseプロジェクト作成して」と依頼
```

### 5. 開発サーバー起動
```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開いて確認

## 🔧 詳細セットアップ

### Node.js & pnpm インストール

#### Windowsの場合
```powershell
# Node.js (Chocolatey使用)
choco install nodejs

# pnpm
npm install -g pnpm

# または、winget使用
winget install OpenJS.NodeJS
```

#### macOSの場合
```bash
# Homebrew使用
brew install node
brew install pnpm

# または、nodenv使用
nodenv install 20.10.0
nodenv global 20.10.0
```

#### Linuxの場合
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm
```

### VSCode セットアップ

#### 必須拡張機能
```json
{
  "recommendations": [
    "biomejs.biome",           // リンター・フォーマッター
    "bradlc.vscode-tailwindcss", // Tailwind CSS
    "ms-playwright.playwright",   // E2Eテスト
    "ms-vscode.vscode-typescript-next", // TypeScript
    "GraphQL.vscode-graphql"     // GraphQL（Supabase用）
  ]
}
```

#### VSCode設定
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 🗄 Supabase セットアップ

### 1. プロジェクト作成
1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクト作成
2. プロジェクト名・リージョン選択
3. データベースパスワード設定

### 2. 環境変数取得
```bash
# Supabase Dashboard > Settings > API から取得
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. データベース初期化
```sql
-- SQL Editor で実行
-- または、Claude Code + MCP Serverで実行

-- ユーザーテーブル（Auth.js用）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  image TEXT,
  email_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- アイテムテーブル（サンプル）
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS設定
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証ユーザーアクセス" ON items
  FOR ALL USING (auth.uid() IS NOT NULL);
```

## 🔐 認証設定

### NextAuth設定
```bash
# .env.local に追加
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=http://localhost:3000

# 本番環境では必ず変更
openssl rand -base64 32
```

### 認証プロバイダー設定

#### Email認証（推奨）
```bash
# SMTPサーバー設定
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### Google OAuth（オプション）
```bash
# Google Cloud Console で OAuth 2.0 クライアント作成
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## ⚙️ 開発ツール設定

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",                    // 開発サーバー
    "build": "next build",                // プロダクションビルド
    "start": "next start",                // プロダクションサーバー
    "lint": "biome check .",              // リンター実行
    "lint:fix": "biome check . --apply",  // リンター修正
    "type-check": "tsc --noEmit",         // 型チェック
    "test": "vitest",                     // ユニットテスト
    "test:ui": "vitest --ui",            // テストUI
    "test:e2e": "playwright test",        // E2Eテスト
    "test:e2e:ui": "playwright test --ui" // E2EテストUI
  }
}
```

### Git Hooks（オプション）
```bash
# Husky + lint-staged インストール
pnpm add -D husky lint-staged

# pre-commit hook設定
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "biome check --apply",
      "git add"
    ]
  }
}
```

## 🧪 テスト環境設定

### ユニットテスト（Vitest）
```typescript
// vitest.config.ts 確認
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
```

### E2Eテスト（Playwright）
```bash
# Playwright セットアップ
npx playwright install

# 設定確認
npx playwright test --headed
```

## 🚀 デプロイ準備

### Vercel CLI（推奨）
```bash
# Vercel CLI インストール
npm install -g vercel

# プロジェクト初期化
vercel

# 環境変数設定
vercel env add NEXTAUTH_SECRET
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ...他の環境変数
```

### GitHub連携
1. GitHubリポジトリ作成
2. Vercelでプロジェクトインポート
3. 環境変数設定
4. 自動デプロイ有効化

## 📁 プロジェクト構造理解

```
my-project/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/        # 認証関連
│   │   ├── api/           # API Routes
│   │   ├── dashboard/     # ダッシュボード
│   │   └── items/         # データ管理
│   ├── components/        # Reactコンポーネント
│   │   ├── ui/           # shadcn/ui
│   │   └── custom/       # カスタムコンポーネント
│   ├── lib/              # ユーティリティ
│   ├── types/            # TypeScript型定義
│   └── __tests__/        # テストファイル
├── docs/                 # プロジェクトドキュメント
├── public/               # 静的ファイル
├── .env.example          # 環境変数テンプレート
├── .env.local            # ローカル環境変数（Git除外）
├── CLAUDE.md             # Claude Code向け仕様書
├── README.md             # プロジェクト概要
└── package.json          # 依存関係・スクリプト
```

## 🐛 トラブルシューティング

### よくある問題

#### Node.js バージョン
```bash
# 現在のバージョン確認
node --version
pnpm --version

# Node.js v20以上、pnpm v8以上が必要
```

#### ポート競合
```bash
# デフォルトポート（3000）が使用中の場合
pnpm dev -- --port 3001

# または、環境変数で設定
PORT=3001 pnpm dev
```

#### Supabase接続エラー
```bash
# 環境変数確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# URLとキーが正しく設定されているか確認
```

#### TypeScript エラー
```bash
# 型チェック実行
pnpm type-check

# キャッシュクリア
rm -rf .next node_modules
pnpm install
```

### ログ確認
```bash
# 開発サーバーログ
pnpm dev

# ビルドログ
pnpm build

# テストログ
pnpm test --reporter=verbose
```

## 📝 次のステップ

1. **認証テスト**: ログイン・ログアウト動作確認
2. **データ操作テスト**: アイテムCRUD操作確認
3. **カスタマイズ開始**: プロジェクト固有の要件実装
4. **テスト作成**: ユニット・E2Eテスト追加
5. **デプロイテスト**: Vercelで本番デプロイ

詳細は以下のドキュメントを参照：
- [開発ワークフロー](./workflow.md)
- [テスト戦略](../test/testing-strategy.md)
- [Claude Code連携](./claude-code-integration.md)