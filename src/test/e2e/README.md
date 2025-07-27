# E2Eテスト実行ガイド

## 前提条件

### システム依存関係のインストール
Playwrightを実行するには、以下のシステムライブラリが必要です：

```bash
# Ubuntu/Debian系
sudo apt-get install libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
                     libcups2 libxkbcommon0 libatspi2.0-0 libxdamage1 \
                     libgbm1 libcairo2 libpango-1.0-0 libasound2

# または Playwright の自動インストール
sudo pnpm exec playwright install-deps
```

### ブラウザのインストール
```bash
pnpm exec playwright install
```

## テスト実行

### 基本的な実行
```bash
# 全E2Eテスト実行
pnpm test:e2e

# 特定のテスト実行
pnpm test:e2e --grep="ログイン"

# UIモードで実行（デバッグ用）
pnpm test:e2e:ui

# 特定のブラウザで実行
pnpm test:e2e --project=chromium
```

### 現在利用可能なテスト

#### 1. 基本的な動作確認 (basic.spec.ts)
- アプリケーション起動確認
- ログインページ表示確認
- API健康性チェック
- 静的アセット読み込み確認
- レスポンシブデザイン確認

#### 2. ダッシュボード機能 (dashboard.spec.ts)
- 統計情報表示
- カテゴリ統計表示
- ナビゲーション機能
- レスポンシブデザイン
- データ更新機能

#### 3. アイテム管理機能 (products.spec.ts)
- アイテム一覧表示
- アイテム検索機能
- アイテム登録・編集
- バリデーション確認
- ページネーション
- ソート機能


## トラブルシューティング

### よくある問題

#### 1. ブラウザ起動エラー
```
Error: browserType.launch: Host system is missing dependencies
```
**解決方法**: 前提条件のシステム依存関係をインストールしてください。

#### 2. タイムアウトエラー
```
Error: Test timeout of 30000ms exceeded
```
**解決方法**: `playwright.config.ts` のタイムアウト設定を調整するか、テストの処理時間を短縮してください。

#### 3. 認証エラー
E2Eテストで認証が必要な場合は、`auth.setup.ts` を参照してください。

### 開発環境での実行

現在の開発環境（WSL2/Docker）では、システム依存関係の問題でPlaywrightが実行できない場合があります。
その場合は以下の代替手段を検討してください：

1. **ローカルマシンでの実行**
2. **CI環境での実行**（GitHub Actions等）
3. **Dockerコンテナでの実行**（適切なbaseイメージ使用）

## CI/CD統合

GitHub Actionsでの実行例：

```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright
  run: pnpm exec playwright install --with-deps

- name: Run E2E tests
  run: pnpm test:e2e
```

## レポート確認

テスト実行後、以下でレポートを確認できます：

```bash
# HTMLレポートを開く
pnpm exec playwright show-report
```

レポートには以下が含まれます：
- テスト実行結果
- スクリーンショット
- 実行トレース
- パフォーマンス情報