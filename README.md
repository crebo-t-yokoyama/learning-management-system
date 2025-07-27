# Next.js Application Template

## 🚀 概要

認証・データベース・UI基盤を含む本格的なNext.jsアプリケーションテンプレート。新規プロジェクトの迅速な立ち上げと、社内開発標準化を目的としています。

### 🎯 特徴
- **即座に利用可能**: 認証・CRUD・ダッシュボード実装済み
- **本番対応**: セキュリティ・パフォーマンス・テスト完備
- **カスタマイズ容易**: 明確なカスタマイズポイント
- **Claude Code最適化**: AI支援開発環境構築済み

## 🛠 技術スタック

**フレームワーク:** Next.js 15 (App Router) + TypeScript  
**認証・DB:** Auth.js + Supabase (PostgreSQL)  
**UI:** shadcn/ui + Tailwind CSS + Lucide Icons  
**品質管理:** Biome + Zod + Vitest + Playwright  
**Claude Code:** 専用hooks + Supabase MCP + 最適化ドキュメント

> 詳細な技術選定理由・設定は [`docs/00_common/tech-stack.md`](docs/00_common/tech-stack.md) を参照

## 📁 プロジェクト構造

```
src/
├── app/              # App Router (Next.js 15)
│   ├── api/         # API Routes
│   ├── dashboard/   # ダッシュボード
│   ├── items/       # サンプルCRUD
│   └── (auth)/      # 認証画面
├── components/      # Reactコンポーネント
│   ├── ui/         # shadcn/ui
│   └── [domain]/   # 機能別
├── lib/            # 設定・ユーティリティ
└── types/          # TypeScript型定義

docs/               # プロジェクトドキュメント
├── 00_common/      # 基本情報
├── 10_architect/   # 設計・アーキテクチャ
├── 20_development/ # 開発手順・ワークフロー
└── 30_test/        # テスト戦略

.claude/            # Claude Code設定
CLAUDE.md          # Claude Code向け仕様
```

## 🚀 クイックスタート

### 1. プロジェクト作成
```bash
# テンプレートからプロジェクト作成
git clone [TEMPLATE_URL] my-project
cd my-project
pnpm install
```

### 2. 環境変数設定
```bash
# .env.localを作成
cp .env.example .env.local
# Supabase情報を設定
```

### 3. データベース準備
1. [Supabase](https://supabase.com)でプロジェクト作成
2. URL・キーを`.env.local`に設定  
3. 認証プロバイダー設定

### 4. 開発開始
```bash
pnpm dev          # 開発サーバー起動
pnpm test         # テスト実行
pnpm lint         # コード品質チェック
```

### 5. カスタマイズ
1. アプリ名: `src/components/navigation/main-nav.tsx:4`
2. データスキーマ: `src/types/database.ts`  
3. バリデーション: `src/lib/validations.ts`
4. エンティティ: `items` → プロジェクト固有名

> 詳細セットアップは [`docs/20_development/getting-started.md`](docs/20_development/getting-started.md) 参照

## 📋 開発コマンド

```bash
# 開発・ビルド
pnpm dev          # 開発サーバー
pnpm build        # 本番ビルド  
pnpm start        # 本番起動

# コード品質
pnpm lint         # Biomeリント
pnpm type-check   # TypeScriptチェック

# テスト
pnpm test         # ユニットテスト (Vitest)
pnpm test:e2e     # E2Eテスト (Playwright)
```

## 🔧 Claude Code 活用

**設定済み機能:**
- Pre-commit hooks (品質チェック)
- Supabase MCP Server (DB操作)  
- 最適化ドキュメント

**効果的な依頼例:**
```
"ユーザープロフィール管理機能を実装してください。

要件: 表示・編集・アバター画像アップロード
制約: Auth.js認証、Supabase RLS、shadcn/ui使用  
実装範囲: API・フロントエンド・バリデーション・テスト"
```

> 詳細ガイド: [`docs/20_development/claude-code-integration.md`](docs/20_development/claude-code-integration.md)

## 📚 ドキュメント

**Claude Code向け:** [`CLAUDE.md`](CLAUDE.md) - AI開発最適化仕様  
**基本情報:** [`docs/00_common/`](docs/00_common/) - 技術スタック・セキュリティ等  
**設計:** [`docs/10_architect/`](docs/10_architect/) - DB・API・アーキテクチャ  
**開発:** [`docs/20_development/`](docs/20_development/) - 手順・ワークフロー  
**テスト:** [`docs/30_test/`](docs/30_test/) - 戦略・実装ガイド

> **運用方針:** `docs/`配下は開発状況に応じて随時更新・拡張してください

## 🚀 デプロイ・運用

**推奨プラットフォーム:** Vercel (GitHub連携・環境変数設定・自動デプロイ)  
**その他対応:** Netlify, Railway, AWS Amplify

**Git運用:**
```
feature/* → PR → main → 自動デプロイ
Conventional Commits形式推奨
```

**セキュリティ:**
- Auth.js セキュアセッション
- Supabase RLS (Row Level Security)  
- Zodバリデーション・入力検証
- CSRF・XSS対策

**パフォーマンス:**
- Next.js最適化 (画像・フォント・バンドル)
- Core Web Vitals監視
- Vercel Analytics対応

## 📄 ライセンス・サポート

**ライセンス:** 独自ライセンス (商用利用は別途相談)  
**社内サポート:** Claude Code設定済み・包括的ドキュメント完備  
**外部サポート:** GitHub Issues・Discussions

---
**Next.js Application Template - Rapid Development Ready** 🚀
