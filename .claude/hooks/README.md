# Claude Code Hooks

## 📋 概要

このテンプレートには**プロジェクト知識自動蓄積システム**が組み込まれています。開発中の重要な変更・決定事項・技術的負債を自動的にドキュメント化し、チーム開発とClaude Code支援を強化します。

## 🎯 知識蓄積システムの特徴

- **開発履歴自動記録**: 機能追加・修正・設計決定を時系列記録
- **API変更追跡**: エンドポイント変更を自動検出・ドキュメント更新提案
- **技術的負債管理**: TODO/FIXME/HACKを自動収集・優先度分類
- **セキュリティ変更追跡**: 認証・セキュリティ関連変更を特別記録

## 🔧 設定済みhooks

### `pre-commit` - 品質チェック
**実行タイミング**: コミット前  
**目的**: コード品質の基本保証

```bash
🔍 TypeScript型チェック
🔧 Biome linting  
🧪 ユニットテスト実行
🏗️ ビルドテスト
```

### `post-commit` - 知識蓄積 🆕
**実行タイミング**: コミット後  
**目的**: プロジェクト知識の自動蓄積

```bash
📝 重要変更を development-log.md に記録
🔍 API変更検出・ドキュメント更新提案  
🗄️ データベース変更追跡
🔒 セキュリティ関連変更記録
🔍 TODO/技術的負債スキャン・統計更新
```

### `todo-scanner` - 技術的負債検出 🆕
**実行タイミング**: post-commitから呼び出し  
**目的**: コード内のTODO/FIXME自動管理

```bash
🔍 TODO/FIXME/HACK/XXX検出
📊 優先度自動分類（高・中・低）
📈 統計情報自動更新
⚠️ 新規技術的負債アラート
```

## 📚 自動生成ドキュメント

### `docs/99_other/development-log.md`
**開発履歴・重要決定記録**
```markdown
### 2024-01-15 14:30 - feat: ユーザープロフィール機能追加
- 変更者: 開発者名
- コミット: abc1234
- 詳細: アバター画像アップロード対応
```

### `docs/99_other/api-changes.md`  
**API変更追跡・仕様整合性管理**
```markdown
### 2024-01-15 14:30 - API変更検出
- 変更ファイル: src/app/api/users/route.ts
- 要確認: docs/10_architect/api-design.md の更新を検討
```

### `docs/99_other/technical-debt.md`
**技術的負債・TODO一元管理**
```markdown
## 🚨 高優先度 (緊急対応必要)
- [ ] **[高]** src/auth.ts:45 - TODO: セキュリティ脆弱性修正

## 📊 統計情報  
- 総TODO数: 12 個
- 高優先度: 2 個, 中優先度: 5 個, 低優先度: 5 個
```

## 🎯 知識蓄積の仕組み

### 自動記録トリガー
```bash
feat: 新機能 → development-log.md 記録
fix: バグ修正 → development-log.md 記録  
refactor: リファクタリング → development-log.md 記録
src/app/api/ 変更 → api-changes.md 更新
// TODO: 追加 → technical-debt.md 更新
セキュリティ関連 → 特別ログ記録
```

### 優先度自動判定
```bash
高優先度: security, auth, vulnerability, critical, urgent
中優先度: performance, refactor, debt, deprecated  
低優先度: 上記以外のTODO/改善事項
```

### 変更検出パターン
```bash
API変更: src/app/api/**/*.ts
DB変更: migration, schema, database, supabase
型変更: src/types/**/*.ts
セキュリティ: auth, security, validation関連
```

## ⚙️ カスタマイズ

### プロジェクト固有パターン追加
```bash
# post-commit hook カスタマイズ例
if [[ $COMMIT_MSG =~ (performance|optimization) ]]; then
    echo "### $COMMIT_DATE - パフォーマンス改善" >> docs/99_other/performance-log.md
fi
```

### TODO検出パターン拡張  
```bash
# todo-scanner カスタマイズ
PATTERNS="TODO|FIXME|HACK|XXX|@deprecated|CUSTOM_PATTERN"
```

### 独自ドキュメント生成
```bash
# 新しいログファイル作成
echo "## カスタムログ" > docs/99_other/custom-log.md
```

## 🔧 実行権限・セットアップ

```bash
# 実行権限付与
chmod +x .claude/hooks/*

# 手動テスト実行  
.claude/hooks/post-commit
.claude/hooks/todo-scanner
```

## 📈 効果・メリット

### 開発チーム向け
- **履歴の可視化**: 重要な変更・決定が見逃されない
- **引き継ぎ効率化**: 新メンバーがプロジェクト経緯を把握しやすい
- **技術的負債管理**: TODOの散在防止・計画的対処

### Claude Code向け
- **コンテキスト充実**: 開発履歴・設計判断が蓄積されAI支援精度向上
- **一貫性保持**: 過去の決定事項に基づく提案・コード生成
- **問題予防**: 技術的負債・セキュリティ課題の早期発見

### プロジェクト管理向け
- **進捗可視化**: 機能追加・修正の実績記録
- **品質管理**: 技術的負債の定量的管理
- **リスク管理**: セキュリティ関連変更の追跡

## 🎯 将来拡張予定

- **週次/月次レポート自動生成**
- **パフォーマンス変更追跡**  
- **依存関係変更ログ**
- **テストカバレッジ推移記録**
- **デプロイ履歴との連携**

---

**Next.js Application Template - Smart Development with Automated Knowledge Accumulation** 🧠✨