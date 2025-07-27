# 学習進捗管理システム API エンドポイント仕様

## 概要

学習進捗管理システムのAPI Routes実装一覧です。すべてのAPIはRESTful設計に基づき、適切な認証・認可、バリデーション、エラーハンドリングを実装しています。

## 認証・認可システム

### 認証方式
- Next.js Auth.js (NextAuth) を使用
- セッションベース認証
- 全APIエンドポイントで認証チェック必須

### 権限レベル
- **管理者 (admin)**: 全機能利用可能
- **受講者 (learner)**: 自分に関連するリソースのみアクセス可能

## API エンドポイント一覧

### 1. ユーザー管理 API（管理者専用）

#### GET /api/users
- **概要**: ユーザー一覧取得
- **権限**: 管理者専用
- **クエリパラメータ**:
  - `page`: ページ番号 (デフォルト: 1)
  - `limit`: 件数 (デフォルト: 20, 最大: 100)
  - `role`: ユーザー役割フィルター
  - `department`: 部署フィルター
  - `search`: 名前・メール検索
  - `sort`: ソート項目 (name, email, department, created_at, last_login_at)
  - `order`: ソート順 (asc, desc)

#### POST /api/users
- **概要**: 新規ユーザー作成
- **権限**: 管理者専用
- **リクエストボディ**:
```json
{
  "email": "user@example.com",
  "name": "ユーザー名",
  "full_name": "フルネーム",
  "department": "部署名",
  "position": "役職",
  "role": "learner",
  "hire_date": "2024-01-01",
  "password": "password123"
}
```

#### GET /api/users/[id]
- **概要**: 特定ユーザー情報取得
- **権限**: 管理者専用

#### PUT /api/users/[id]
- **概要**: ユーザー情報更新
- **権限**: 管理者専用
- **特記事項**: パスワード更新は別途処理

#### DELETE /api/users/[id]
- **概要**: ユーザー削除
- **権限**: 管理者専用
- **制限事項**: 
  - 自分自身の削除不可
  - 関連データ（受講割り当て・学習記録）がある場合は削除不可

### 2. コース管理 API

#### GET /api/courses
- **概要**: コース一覧取得
- **権限**: 
  - 管理者: 全コース取得
  - 受講者: 割り当て済みコースのみ取得
- **クエリパラメータ**:
  - `page`, `limit`: ページネーション
  - `category`: カテゴリフィルター
  - `difficulty_level`: 難易度フィルター
  - `is_active`: 有効/無効フィルター
  - `search`: タイトル・概要検索
  - `sort`, `order`: ソート設定

#### POST /api/courses
- **概要**: 新規コース作成
- **権限**: 管理者専用
- **リクエストボディ**:
```json
{
  "title": "コースタイトル",
  "overview": "概要",
  "description": "詳細説明",
  "category": "カテゴリ",
  "difficulty_level": "beginner",
  "estimated_hours": 10,
  "is_active": true
}
```

#### GET /api/courses/[id]
- **概要**: 特定コース情報取得
- **権限**: 
  - 管理者: 全コース取得可能
  - 受講者: 割り当て済みコースのみ取得可能

#### PUT /api/courses/[id]
- **概要**: コース情報更新
- **権限**: 管理者専用

#### DELETE /api/courses/[id]
- **概要**: コース削除
- **権限**: 管理者専用
- **制限事項**: 受講者が割り当てられている場合は削除不可

### 3. 受講者割り当て API

#### GET /api/enrollments
- **概要**: 受講割り当て一覧取得
- **権限**:
  - 管理者: 全受講割り当て取得
  - 受講者: 自分の受講割り当てのみ取得
- **クエリパラメータ**:
  - `page`, `limit`: ページネーション
  - `learner_id`: 受講者IDフィルター
  - `course_id`: コースIDフィルター
  - `status`: ステータスフィルター
  - `assigned_by`: 割り当て者IDフィルター
  - `sort`, `order`: ソート設定

#### POST /api/enrollments
- **概要**: 新規受講割り当て作成
- **権限**: 管理者専用
- **リクエストボディ**:
```json
{
  "learner_id": "受講者ID",
  "course_id": "コースID",
  "due_date": "2024-12-31",
  "status": "assigned"
}
```

#### GET /api/enrollments/[id]
- **概要**: 特定受講割り当て情報取得
- **権限**:
  - 管理者: 全受講割り当て取得可能
  - 受講者: 自分の受講割り当てのみ取得可能

#### PUT /api/enrollments/[id]
- **概要**: 受講割り当て情報更新
- **権限**:
  - 管理者: 全項目更新可能
  - 受講者: 進捗率・ステータスのみ更新可能（自分の受講割り当てのみ）
- **自動処理**:
  - ステータス変更時の開始日・完了日自動設定
  - 進捗率100%時の自動完了処理

#### DELETE /api/enrollments/[id]
- **概要**: 受講割り当て削除
- **権限**: 管理者専用
- **制限事項**: 学習記録がある場合は削除不可

### 4. 学習記録 API

#### GET /api/learning-records
- **概要**: 学習記録一覧取得
- **権限**:
  - 管理者: 全学習記録取得
  - 受講者: 自分の学習記録のみ取得
- **クエリパラメータ**:
  - `page`, `limit`: ページネーション
  - `learner_id`: 受講者IDフィルター
  - `course_id`: コースIDフィルター
  - `enrollment_id`: 受講割り当てIDフィルター
  - `date_from`, `date_to`: 日付範囲フィルター
  - `sort`, `order`: ソート設定

#### POST /api/learning-records
- **概要**: 新規学習記録作成
- **権限**:
  - 管理者: 全受講者の学習記録作成可能
  - 受講者: 自分の学習記録のみ作成可能
- **リクエストボディ**:
```json
{
  "enrollment_id": "受講割り当てID",
  "course_id": "コースID",
  "learner_id": "受講者ID",
  "session_start_time": "2024-01-01T10:00:00Z",
  "session_end_time": "2024-01-01T11:00:00Z",
  "session_duration_minutes": 60,
  "progress_percentage": 25,
  "understanding_level": 4,
  "learning_memo": "学習メモ"
}
```

#### GET /api/learning-records/[id]
- **概要**: 特定学習記録情報取得
- **権限**:
  - 管理者: 全学習記録取得可能
  - 受講者: 自分の学習記録のみ取得可能

#### PUT /api/learning-records/[id]
- **概要**: 学習記録更新
- **権限**:
  - 管理者: 全学習記録更新可能
  - 受講者: 自分の当日作成分のみ更新可能
- **制限事項**: 受講者は当日作成された学習記録のみ更新可能

#### DELETE /api/learning-records/[id]
- **概要**: 学習記録削除
- **権限**:
  - 管理者: 全学習記録削除可能
  - 受講者: 自分の当日作成分のみ削除可能
- **制限事項**: 受講者は当日作成された学習記録のみ削除可能

### 5. 統計 API

#### GET /api/statistics/dashboard
- **概要**: ダッシュボード統計取得
- **権限**:
  - 管理者: 全体統計
  - 受講者: 個人統計
- **レスポンス内容**:
  - 概要統計（受講者数、コース数、進捗率など）
  - 月間アクティビティ
  - アラート情報（管理者のみ）
  - 最近のアクティビティ
  - コース別進捗

#### GET /api/statistics/course-progress
- **概要**: コース別進捗統計取得
- **権限**:
  - 管理者: 全コースの統計
  - 受講者: 割り当てられたコースの統計
- **レスポンス内容**:
  - コース別の進捗分布
  - 受講者数・完了者数
  - 平均進捗率・理解度

#### GET /api/statistics/user-progress
- **概要**: ユーザー別進捗統計取得
- **権限**: 管理者専用
- **レスポンス内容**:
  - ユーザー別の学習統計
  - コース別の受講状況
  - 学習時間・理解度統計

### 6. レポート API

#### GET /api/reports/learning-summary
- **概要**: 学習サマリーレポート取得
- **権限**:
  - 管理者: 全体レポート
  - 受講者: 個人レポート
- **出力形式**: JSON または CSV
- **クエリパラメータ**:
  - `format`: 出力形式 (json, csv)
  - `date_from`, `date_to`: 期間指定
  - `department`: 部署フィルター
  - `category`: カテゴリフィルター
  - `learner_id`, `course_id`: 個別フィルター

## 共通仕様

### レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": "...",
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### エラーレスポンス
```json
{
  "error": "エラーメッセージ",
  "details": {
    "field": ["フィールド固有のエラー"]
  }
}
```

### HTTPステータスコード

- **200**: 成功
- **201**: 作成成功
- **400**: バリデーションエラー
- **401**: 認証エラー
- **403**: 権限不足
- **404**: リソースが見つからない
- **409**: 競合エラー（重複データなど）
- **500**: サーバーエラー

### セキュリティ対策

1. **認証・認可**: 全APIで認証チェック実装
2. **入力値検証**: Zodを使用した厳密なバリデーション
3. **SQLインジェクション対策**: SupabaseのORM使用
4. **XSS対策**: 入力値のサニタイズ
5. **レート制限**: 必要に応じて実装可能
6. **監査ログ**: 作成・更新・削除時のログ記録

### パフォーマンス最適化

1. **ページネーション**: 大量データの効率的な取得
2. **フィルタリング**: データベースレベルでの絞り込み
3. **インデックス**: 検索性能の最適化
4. **キャッシュ**: 統計データの適切なキャッシュ
5. **レスポンス圧縮**: gzip圧縮対応

### 開発・テスト

- **型安全性**: TypeScript strict mode対応
- **バリデーション**: Zodスキーマによる厳密な検証
- **エラーハンドリング**: 統一されたエラー処理
- **ログ**: 適切なエラーログ出力
- **テスト**: ユニットテスト・E2Eテスト対応

## 利用例

### ユーザー一覧取得
```bash
GET /api/users?page=1&limit=20&role=learner&search=田中
Authorization: Bearer <session-token>
```

### コース作成
```bash
POST /api/courses
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "title": "JavaScript基礎講座",
  "category": "プログラミング",
  "difficulty_level": "beginner",
  "estimated_hours": 20
}
```

### 学習記録作成
```bash
POST /api/learning-records
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "enrollment_id": "enrollment-id",
  "course_id": "course-id",
  "learner_id": "learner-id",
  "session_start_time": "2024-01-01T10:00:00Z",
  "session_duration_minutes": 60,
  "progress_percentage": 25
}
```

このAPI設計により、学習進捗管理システムの全機能をセキュアかつ効率的に提供できます。