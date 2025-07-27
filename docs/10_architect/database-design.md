# データベース設計

## 📊 概要

このテンプレートは**Supabase PostgreSQL**を使用し、**Row Level Security (RLS)** による安全なデータアクセスを実現します。

## 🏗 基本テーブル構成

### 認証関連テーブル（Auth.js用）

#### users - ユーザー情報
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  image TEXT,
  email_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
```

#### accounts - 外部プロバイダー情報
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  provider_account_id VARCHAR NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR,
  scope VARCHAR,
  id_token TEXT,
  session_state VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider, provider_account_id)
);

-- インデックス
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
```

#### sessions - セッション管理
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
```

### アプリケーション用テーブル

#### items - 汎用アイテムテーブル（カスタマイズ用）
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_created_by ON items(created_by);
CREATE INDEX idx_items_created_at ON items(created_at);

-- 更新時刻の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at 
  BEFORE UPDATE ON items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🛡 Row Level Security (RLS)

### 基本ポリシー設定

```sql
-- RLS有効化
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーのみアクセス可能
CREATE POLICY "認証ユーザーは全てのアイテムを閲覧可能" ON items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 認証ユーザーは作成可能
CREATE POLICY "認証ユーザーはアイテムを作成可能" ON items
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- 作成者のみ更新可能
CREATE POLICY "作成者はアイテムを更新可能" ON items
  FOR UPDATE 
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 作成者のみ削除可能
CREATE POLICY "作成者はアイテムを削除可能" ON items
  FOR DELETE 
  USING (created_by = auth.uid());
```

### 高度なRLSパターン

#### 組織ベースアクセス制御
```sql
-- 組織テーブル（必要に応じて追加）
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー・組織関連テーブル
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL DEFAULT 'member', -- member, admin, owner
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, organization_id)
);

-- 組織レベルのRLS
CREATE POLICY "組織メンバーは組織のアイテムのみアクセス可能" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid() 
      AND uo.organization_id = items.organization_id
    )
  );
```

#### ロールベースアクセス制御
```sql
-- ユーザーロールテーブル
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL, -- admin, editor, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, role)
);

-- 管理者は全てのアイテムにアクセス可能
CREATE POLICY "管理者は全ての操作が可能" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 編集者は読み書き可能
CREATE POLICY "編集者は読み書き可能" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );
```

## 📈 パフォーマンス最適化

### インデックス戦略

#### 基本インデックス
```sql
-- 主キー（自動作成）
-- 外部キー（推奨）
CREATE INDEX idx_items_created_by ON items(created_by);
CREATE INDEX idx_items_updated_by ON items(updated_by);

-- 検索用複合インデックス
CREATE INDEX idx_items_name_created_at ON items(name, created_at DESC);

-- 部分インデックス（条件付き）
CREATE INDEX idx_items_active ON items(id) WHERE deleted_at IS NULL;
```

#### フルテキスト検索
```sql
-- 日本語対応フルテキスト検索
ALTER TABLE items ADD COLUMN search_vector tsvector;

-- 検索ベクトル更新関数
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', 
    COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER update_items_search_vector
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- 検索用インデックス
CREATE INDEX idx_items_search ON items USING gin(search_vector);

-- 検索クエリ例
SELECT * FROM items 
WHERE search_vector @@ to_tsquery('simple', 'キーワード');
```

### クエリ最適化

#### 効率的なページネーション
```sql
-- オフセットベース（小規模データ向け）
SELECT * FROM items 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;

-- カーソルベース（大規模データ向け）
SELECT * FROM items 
WHERE created_at < '2024-01-01 00:00:00'
ORDER BY created_at DESC 
LIMIT 20;
```

#### 集計クエリの最適化
```sql
-- マテリアライズドビュー（統計データ用）
CREATE MATERIALIZED VIEW item_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_items,
  COUNT(DISTINCT created_by) as unique_creators
FROM items
GROUP BY DATE_TRUNC('day', created_at);

-- 定期更新
CREATE OR REPLACE FUNCTION refresh_item_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW item_stats;
END;
$$ LANGUAGE plpgsql;
```

## 🔄 データベースマイグレーション

### Supabase Migration例

#### 初期セットアップ
```sql
-- migrations/20240101000001_initial_setup.sql

-- ユーザーテーブル（Auth.js用）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  image TEXT,
  email_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 基本アイテムテーブル
CREATE TABLE IF NOT EXISTS items (
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

#### 機能追加マイグレーション
```sql
-- migrations/20240102000001_add_categories.sql

-- カテゴリテーブル追加
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- アイテムテーブルにカテゴリ関連追加
ALTER TABLE items ADD COLUMN category_id UUID REFERENCES categories(id);
CREATE INDEX idx_items_category ON items(category_id);

-- 初期カテゴリデータ
INSERT INTO categories (name, description) VALUES
  ('その他', 'デフォルトカテゴリ');
```

## 🔍 データベース監視

### パフォーマンス監視
```sql
-- 実行時間の長いクエリ
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- テーブルサイズ監視
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- インデックス使用状況
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes 
ORDER BY idx_scan ASC;
```

## 📋 カスタマイズガイド

### 新しいテーブル追加時のチェックリスト

1. **基本設計**
   - [ ] 適切な主キー設定
   - [ ] 外部キー制約
   - [ ] NOT NULL制約
   - [ ] デフォルト値設定

2. **RLS設定**
   - [ ] RLS有効化
   - [ ] 適切なポリシー設定
   - [ ] テストデータでの動作確認

3. **インデックス**
   - [ ] 検索に使用するカラムのインデックス
   - [ ] 外部キーのインデックス
   - [ ] 複合インデックスの検討

4. **トリガー**
   - [ ] updated_at自動更新
   - [ ] バリデーション処理
   - [ ] ログ記録

5. **監視・運用**
   - [ ] パフォーマンス監視設定
   - [ ] バックアップ対象確認
   - [ ] ドキュメント更新

### TypeScript型定義の自動生成
```bash
# Supabase CLI使用
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

# または、MCP Server経由でClaude Codeに生成依頼
```