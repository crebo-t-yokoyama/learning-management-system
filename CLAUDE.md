# Next.js Application Template

## 🎯 プロジェクト概要

認証・データベース・UI基盤を含む汎用Next.jsテンプレート。新規プロジェクトの迅速な立ち上げを目的とします。

**テンプレート特性:**
- 実装済み基本機能: 認証、CRUD、ダッシュボード
- カスタマイズポイント明確化
- Claude Code最適化設計

## 🔧 カスタマイズ要項目

**必須変更:**
1. プロジェクト名・説明 (このファイル冒頭)
2. アプリ名: `src/components/navigation/main-nav.tsx:4`
3. エンティティ名: `items` → 実際のビジネスエンティティ
4. API Routes: `/api/items` → プロジェクト固有エンドポイント

**現在の実装:**
- ✅ 認証 (Auth.js + Supabase)
- ✅ 基本CRUD (`items`テーブル)  
- ✅ ダッシュボード (メトリクス表示)
- ✅ API Routes (RESTful設計)

## 🏗 技術構成

**コア:** Next.js 15 + TypeScript + Supabase + Auth.js  
**UI:** shadcn/ui + Tailwind CSS  
**開発:** Biome + Zod + Vitest + Playwright  
**詳細:** `docs/00_common/tech-stack.md`

## ⚡ 開発パターン

**新機能追加:**
1. Supabaseテーブル作成 → 2. Zodスキーマ定義 → 3. API Routes → 4. UI実装 → 5. テスト

**API認証テンプレート:**
```typescript
const session = await getServerSession(authOptions)
if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
const validatedData = schema.parse(body)
const { data, error } = await supabase.from('table').insert(validatedData)
```

## 🤖 Claude Code 連携

**利用可能ツール:**
- Supabase MCP Server (DB操作・ブランチ管理)
- GitHub CLI (PR・Issue管理)

**開発原則:**
- セキュリティファースト (認証・バリデーション必須)
- 型安全性 (TypeScript strict + Zod)
- テスト必須 (ユニット・E2E)

**Git運用:**
- ブランチ命名: `feature/`, `fix/`, `chore/`, `docs/`
- コミット: Conventional Commits
- 機能完了時PR自動作成

**ドキュメント:**
- `docs/00_common/` - 基本情報 (常時参照)
- `docs/20_development/claude-code-integration.md` - 詳細ガイド
- `docs/10_architect/` - 設計詳細
- `docs/30_test/` - テスト戦略

> **重要:** `docs/`配下は開発進捗に応じて柔軟に更新・追加してください