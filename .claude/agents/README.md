# Claude Code Agents 設定ファイル

## 📋 概要

このディレクトリには、Next.js Application Template専用のClaude Code Agents設定ファイルが含まれています。各Agentは特定の専門分野に特化し、高品質な開発支援を提供します。

## 🎯 Agent一覧

| Agent名 | 専門分野 | 用途 | ファイル |
|---------|----------|------|----------|
| **nextjs-expert** | Next.js・React・TypeScript | フロントエンド開発 | [nextjs-expert.md](./nextjs-expert.md) |
| **supabase-admin** | Supabase・データベース | DB設計・管理 | [supabase-admin.md](./supabase-admin.md) |
| **ui-designer** | デザインシステム・UI/UX | コンポーネント設計 | [ui-designer.md](./ui-designer.md) |
| **test-engineer** | テスト戦略・品質保証 | テスト実装 | [test-engineer.md](./test-engineer.md) |
| **doc-writer** | 技術文書作成 | ドキュメント管理 | [doc-writer.md](./doc-writer.md) |

## 🔧 Agent作成手順

### 1. Claude CodeでAgentsメニューを開く
```bash
/agents
```

### 2. 新しいAgentを作成
- **スコープ選択**: "Project level" を選択（このテンプレート専用）
- **Agent名**: 上記表のAgent名を使用
- **システムプロンプト**: 各設定ファイルの内容をコピー

### 3. 各Agent設定の詳細手順

#### Next.js Expert Agent
1. Agent名: `nextjs-expert`
2. システムプロンプト: [nextjs-expert.md](./nextjs-expert.md) の「システムプロンプト」セクションをコピー
3. 利用可能ツール: すべて選択
4. 保存

#### Supabase Administrator Agent  
1. Agent名: `supabase-admin`
2. システムプロンプト: [supabase-admin.md](./supabase-admin.md) の「システムプロンプト」セクションをコピー
3. 利用可能ツール: Supabase MCP, ファイル操作, Bash
4. 保存

#### UI/UX Designer Agent
1. Agent名: `ui-designer`
2. システムプロンプト: [ui-designer.md](./ui-designer.md) の「システムプロンプト」セクションをコピー
3. 利用可能ツール: ファイル操作（Read, Write, Edit）
4. 保存

#### Test Engineer Agent
1. Agent名: `test-engineer`  
2. システムプロンプト: [test-engineer.md](./test-engineer.md) の「システムプロンプト」セクションをコピー
3. 利用可能ツール: ファイル操作, Bash
4. 保存

#### Documentation Writer Agent
1. Agent名: `doc-writer`
2. システムプロンプト: [doc-writer.md](./doc-writer.md) の「システムプロンプト」セクションをコピー  
3. 利用可能ツール: ファイル操作（Read, Write, Edit）
4. 保存

## 🚀 Agent活用方法

### Agent選択指針
| 作業内容 | 推奨Agent | 理由 |
|---------|----------|-----|
| 新機能実装 | `nextjs-expert` | フロントエンド全般の専門知識 |
| DB設計・変更 | `supabase-admin` | データベース・セキュリティ専門 |
| UI改善 | `ui-designer` | デザインシステム・UX専門 |
| テスト作成 | `test-engineer` | テスト戦略・品質保証専門 |
| 文書作成 | `doc-writer` | 技術文書・仕様書専門 |

### 効果的な依頼例

#### 新機能開発フロー
```bash
# 1. データベース設計
@supabase-admin "ブログ機能用のテーブル設計をお願いします"

# 2. フロントエンド実装  
@nextjs-expert "ブログ投稿・表示機能を実装してください"

# 3. UI/UX改善
@ui-designer "ブログ一覧のレスポンシブデザインを作成してください"

# 4. テスト作成
@test-engineer "ブログ機能のE2Eテストを作成してください"

# 5. ドキュメント作成
@doc-writer "ブログAPI仕様書を作成してください"
```

#### 包括的な依頼例
```bash
@nextjs-expert "ユーザーダッシュボードを実装してください。

要件:
- リアルタイムデータ表示
- レスポンシブ対応
- Server Components使用
- 適切なエラーハンドリング

技術制約:
- 既存のSupabase認証と連携
- shadcn/ui コンポーネント使用
- TypeScript strict mode準拠"
```

## 🎯 Agent最適化tips

### 1. 具体的な要件指定
```bash
# 良い例
"ユーザープロフィール編集機能を実装してください。
Server Component基盤で、バリデーション（Zod）、
リアルタイム更新対応、エラーハンドリング含む。"

# 避ける例  
"プロフィール機能作って"
```

### 2. コンテキスト情報提供
```bash
"既存のユーザー認証システム（Auth.js + Supabase）を拡張して、
ソーシャルログインを追加してください。
現在のusersテーブル構造を維持しつつ実装。"
```

### 3. 制約・要件の明示
```bash
"パフォーマンス: 初期読み込み2秒以内
セキュリティ: RLS必須、認証ユーザーのみアクセス  
UI: モバイル対応、アクセシビリティ準拠"
```

## 🔧 Agent動作確認

### 初期設定後のテスト
```bash
# 各Agentに簡単なタスクを依頼して動作確認

@nextjs-expert "現在のプロジェクト構造を説明してください"
@supabase-admin "現在のデータベース構成を確認してください"  
@ui-designer "現在のデザインシステムについて説明してください"
@test-engineer "現在のテスト環境について説明してください"
@doc-writer "このプロジェクトの技術文書構成を確認してください"
```

## 📚 継続的改善

### Agent使用状況の記録
- 効果的だった依頼パターンの蓄積
- Agent別の得意分野・苦手分野の把握
- システムプロンプトの継続的調整

### ベストプラクティス共有
- チーム内での効果的な依頼方法共有
- Agent活用事例の文書化
- 新メンバー向けのAgent活用ガイド

## 🔄 Agent更新・保守

### 定期的な見直し
- プロジェクト進展に応じたAgentプロンプト調整
- 新技術・ツール追加時のAgent更新
- 使用頻度・効果に基づくAgent最適化

### 設定バックアップ
- Agent設定の定期的なバックアップ
- 設定変更履歴の記録
- チーム間でのAgent設定共有

---

*専門特化されたClaude Code Agentsにより、各分野のエキスパート支援を受けながら高効率開発を実現します*