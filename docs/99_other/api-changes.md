# API変更履歴

## 📋 概要

API Routes の変更・追加・削除を自動追跡し、仕様書との整合性を管理します。

## 🔄 変更検出システム

Claude Code hooks が以下を自動検出:
- `src/app/api/` 配下のファイル変更
- 新規エンドポイント追加
- 既存エンドポイント変更・削除
- リクエスト・レスポンス形式変更

---

## 📊 現在のAPI一覧

### 認証API
- `POST /api/auth/[...nextauth]` - NextAuth認証

### CRUD API (テンプレート)
- `GET /api/items` - アイテム一覧取得
- `POST /api/items` - アイテム作成
- `GET /api/items/[id]` - アイテム詳細取得
- `PUT /api/items/[id]` - アイテム更新
- `DELETE /api/items/[id]` - アイテム削除

---

## 🔄 変更履歴

### 2024-XX-XX - 初期API実装
- 基本CRUD API作成
- Zodバリデーション実装
- 認証チェック追加

---

## ⚠️ 破壊的変更

*将来の破壊的変更はここに記録されます*

---

## 📝 更新が必要なドキュメント

API変更検出時に更新推奨：
- [ ] `docs/10_architect/api-design.md` - API設計詳細
- [ ] OpenAPI仕様書 (未実装)
- [ ] フロントエンド型定義

---

*このファイルは Claude Code hooks により自動更新されます*