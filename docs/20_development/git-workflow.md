# Git運用ルール・ワークフロー

## 📋 概要

このテンプレートでのGit運用ルール・ブランチ戦略・コミット規約を説明します。チーム開発とClaude Code連携を最適化した標準的なワークフローです。

## 🌳 ブランチ戦略

### メインブランチ
- **main**: 本番デプロイ用・安定版
- **develop**: 開発統合用 (オプション)

### 作業ブランチ命名規則
```bash
feature/[機能名]     # 新機能開発
fix/[修正内容]       # バグ修正
refactor/[対象]      # リファクタリング
docs/[ドキュメント名] # ドキュメント更新
chore/[作業内容]     # 環境設定・依存関係等
hotfix/[緊急修正]    # 本番緊急修正
```

### ブランチ運用例
```bash
# 新機能開発
git checkout -b feature/user-profile

# バグ修正
git checkout -b fix/login-validation-error

# ドキュメント更新
git checkout -b docs/api-specification
```

## 📝 コミットメッセージ規約

### Conventional Commits形式
```
<type>: <description>

[optional body]

[optional footer]
```

### コミットタイプ
- **feat**: 新機能追加
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: コードスタイル変更 (機能に影響なし)
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **chore**: ビルド・設定変更

### コミットメッセージ例
```bash
# 良い例
feat: ユーザープロフィール編集機能を追加

fix: ログイン時のバリデーションエラーを修正

docs: API仕様書にエラーレスポンス例を追加

refactor: ユーザー認証ロジックを共通化

# 避ける例
"Update"
"Fix bug"
"WIP"
```

## 🔄 標準ワークフロー

### 1. 機能開発フロー
```bash
# 1. 最新のmainから作業ブランチ作成
git checkout main
git pull origin main
git checkout -b feature/new-feature

# 2. 開発・コミット
git add .
git commit -m "feat: 新機能の初期実装"

# 3. 定期的にmainと同期
git fetch origin
git rebase origin/main

# 4. プッシュ・PR作成
git push origin feature/new-feature
# GitHub/GitLabでPR作成

# 5. レビュー・マージ後
git checkout main
git pull origin main
git branch -d feature/new-feature
```

### 2. Claude Code連携フロー
```bash
# Claude Codeでの依頼例
"新しいユーザー認証機能を実装してください。
完了後、適切なブランチ名でコミット・プッシュし、
PRを作成してください。"

# 自動実行される処理
# 1. feature/user-authenticationブランチ作成
# 2. 機能実装・テスト作成
# 3. Conventional Commitsでコミット
# 4. プッシュ・PR作成
```

## 🔧 Claude Code hooks連携

### post-commit自動処理
```bash
# コミット後自動実行
📝 development-log.md に変更履歴記録
🔍 API変更検出・ドキュメント更新提案
🗄️ データベース変更追跡
🔒 セキュリティ変更記録
📊 TODO/技術的負債統計更新
```

### 自動記録対象
- **feat**: 新機能→ development-log.md
- **fix**: バグ修正 → development-log.md
- **API変更**: src/app/api/ → api-changes.md
- **DB変更**: マイグレーション関連 → development-log.md
- **セキュリティ**: 認証・セキュリティ → セキュリティログ

## 📋 PR (Pull Request) ガイドライン

### PRテンプレート
```markdown
## 概要
[変更の概要を簡潔に]

## 変更内容
- [ ] 新機能追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] テスト追加
- [ ] ドキュメント更新

## テスト
- [ ] ユニットテスト追加・更新
- [ ] E2Eテスト確認
- [ ] 手動テスト完了

## チェックリスト
- [ ] TypeScript型チェック通過
- [ ] Biome linting通過
- [ ] 新機能にテスト追加
- [ ] 関連ドキュメント更新

## 関連Issue
Fixes #[issue番号]
```

### PR作成時の自動チェック
```bash
# pre-push hook実行内容
🔍 TypeScript型チェック
🔧 Biome linting
🧪 ユニットテスト実行
🏗️ ビルドテスト
```

## 🎯 ベストプラクティス

### コミット頻度
- **小さく・頻繁に**: 機能単位での細かいコミット
- **論理的まとまり**: 関連する変更をグループ化
- **WIPコミット避ける**: 完了した状態でコミット

### ブランチ管理
```bash
# 長期間のブランチは定期的にrebase
git fetch origin
git rebase origin/main

# 完了したブランチは削除
git branch -d feature/completed-feature
git push origin --delete feature/completed-feature
```

### コンフリクト解決
```bash
# rebase中のコンフリクト
git status  # コンフリクトファイル確認
# ファイル編集でコンフリクト解決
git add .
git rebase --continue

# マージコンフリクト防止のため定期的なrebase推奨
```

## 🚨 緊急対応 (Hotfix)

### 本番緊急修正フロー
```bash
# 1. mainから緊急修正ブランチ作成
git checkout main
git checkout -b hotfix/critical-security-fix

# 2. 修正・テスト
git commit -m "fix: セキュリティ脆弱性の緊急修正"

# 3. 即座にmainへマージ
git checkout main
git merge hotfix/critical-security-fix
git push origin main

# 4. developにも反映 (存在する場合)
git checkout develop
git merge hotfix/critical-security-fix
git push origin develop

# 5. ブランチ削除
git branch -d hotfix/critical-security-fix
```

## 🔍 トラブルシューティング

### よくある問題
```bash
# 1. rebase時のコンフリクト
git rebase --abort  # rebase中止
git merge origin/main  # merge戦略に変更

# 2. 間違ったコミットメッセージ
git commit --amend -m "正しいメッセージ"

# 3. 直前のコミットを取り消し
git reset --soft HEAD~1

# 4. ブランチ間の変更移動
git checkout target-branch
git cherry-pick <commit-hash>
```

### hooks関連問題
```bash
# hooks実行権限エラー
chmod +x .claude/hooks/*

# hooks無効化 (一時的)
git commit --no-verify -m "message"
```

## 📚 Claude Code活用tips

### 効果的な依頼例
```bash
"feature/user-settingsブランチを作成して、
ユーザー設定画面を実装してください。
実装完了後、適切なコミットメッセージでコミット・プッシュし、
PRを作成してください。"

"現在のコミット履歴を確認して、
リリースノート用の変更サマリーを作成してください"
```

### 自動化されるGit操作
- ブランチ作成・切り替え
- 適切なコミットメッセージ生成
- プッシュ・PR作成
- 変更履歴の自動記録

---

*統一されたGit運用により、効率的なチーム開発とプロジェクト知識の蓄積を実現します*