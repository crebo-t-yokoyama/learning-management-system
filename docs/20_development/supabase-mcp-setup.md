# Supabase MCP Server セットアップ

## 📋 概要

Supabase MCP (Model Context Protocol) Server により、Claude CodeからSupabaseデータベースを直接操作できます。テーブル作成・データ操作・ブランチ管理が可能になります。

## 🔧 事前準備

### 必要な情報
1. **Supabase Project URL**: `https://xxx.supabase.co`
2. **Service Role Key**: `supabase_service_role_key`
3. **プロジェクトID**: ダッシュボードから確認

### Claude Code設定確認
Claude CodeでSupabase MCPが利用可能か確認：
```bash
# Claude Codeで以下を実行
"Supabase MCPサーバーが利用可能か確認してください"
```

## ⚙️ MCP設定方法

### 1. Claude Code設定ファイル
`.claude/config.json` (存在しない場合は作成):
```json
{
  "mcp_servers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### 2. 環境変数設定
`.env.local` に以下を追加:
```env
# Supabase MCP用
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
```

### 3. パッケージインストール
```bash
# Supabase MCP Serverをインストール
npm install -g @supabase/mcp-server

# または、プロジェクトローカルに
npm install --save-dev @supabase/mcp-server
```

## 🎯 利用可能な操作

### データベース操作
```bash
# Claude Codeで実行例

"usersテーブルを作成してください。
カラム: id (UUID), email (unique), name, created_at"

"Supabaseでproductsテーブルにサンプルデータを5件追加してください"

"usersテーブルのRLSポリシーを設定してください。
認証ユーザーのみ自分のレコードにアクセス可能"
```

### スキーマ管理
```bash
"現在のデータベーススキーマを確認してください"

"postsテーブルにカテゴリ機能を追加するマイグレーションを作成"

"データベースの全テーブル一覧を表示してください"
```

### 開発ブランチ管理
```bash
"開発用ブランチを作成してください"

"ブランチでテスト用テーブルを作成後、main環境にマージ"

"開発ブランチをリセットして最新のmainと同期"
```

## 🔒 セキュリティ設定

### Service Role Key管理
- **環境変数のみで管理**: `.env.local`、絶対にコミットしない
- **開発環境専用**: 本番環境とは別のキーを使用
- **定期的なローテーション**: セキュリティのため定期更新

### RLS (Row Level Security) 必須
```sql
-- 全テーブルでRLS有効化
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーのみアクセス可能
CREATE POLICY "authenticated_access" ON table_name 
FOR ALL USING (auth.uid() IS NOT NULL);
```

## 🚨 注意事項

### 本番環境での制限
- **開発・ステージング環境のみ**: 本番DBでのMCP使用は避ける
- **バックアップ必須**: 重要操作前は必ずバックアップ
- **段階的適用**: 開発→ステージング→本番の順で適用

### データ保護
- **機密データ注意**: Claude Codeとのやり取りでは機密情報に注意
- **ログ確認**: 操作ログを定期的に確認
- **権限最小化**: 必要最小限の権限のみ付与

## 🛠 トラブルシューティング

### 接続エラー
```bash
# 設定確認
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# ネットワーク確認
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL/rest/v1/"
```

### 権限エラー
```bash
# Service Role Keyの権限確認
# Supabaseダッシュボード > Settings > API > Service Role Keyを確認
```

### MCP Server起動エラー
```bash
# MCPサーバー手動起動テスト
npx @supabase/mcp-server

# バージョン確認
npm list -g @supabase/mcp-server
```

## 📚 実用例

### プロジェクト初期セットアップ
```bash
"新規プロジェクト用にSupabaseを設定してください。

必要テーブル:
- users (Auth.js用)
- profiles (ユーザープロフィール)
- posts (ブログ投稿)

各テーブルに適切なRLSポリシーも設定"
```

### 機能開発時の活用
```bash
"アイテム管理機能を追加します。

1. itemsテーブル作成
2. categoriesテーブル作成
3. 適切なリレーション設定
4. RLSポリシー設定
5. TypeScript型定義生成"
```

### データメンテナンス
```bash
"テストデータをクリーンアップしてください。
item_codeが'TEST_'で始まるレコードを全て削除"

"パフォーマンス改善のため、usersテーブルにemailのインデックス追加"
```

## 🎯 ベストプラクティス

### 開発フロー
1. **開発ブランチ作成**: 機能開発前に専用ブランチ作成
2. **段階的実装**: 小さな変更を積み重ね
3. **テスト実行**: 各変更後にテスト確認
4. **マージ実行**: 完了後にmain環境へマージ

### Claude Code依頼の仕方
```bash
# 良い例: 具体的・段階的
"ユーザー認証機能を実装してください。
1. usersテーブル作成 (Auth.js用)
2. profilesテーブル作成 (追加情報用)
3. 適切なRLSポリシー設定
4. TypeScript型定義生成"

# 避ける例: 曖昧・包括的
"認証システム作って"
```

### データ設計原則
- **正規化**: 適切なテーブル分割
- **インデックス**: クエリ性能考慮
- **制約**: データ整合性確保
- **RLS**: セキュリティ必須

---

*Supabase MCP設定により、Claude Codeでの効率的なデータベース開発が可能になります*