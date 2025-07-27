# 環境変数設定ガイド

## 📋 概要

サンプルアプリケーションの環境変数設定手順とベストプラクティスを説明します。開発・ステージング・本番環境での適切な設定方法を学べます。

## ⚡ クイックセットアップ

### 1. テンプレートファイルコピー
```bash
cp .env.example .env.local
```

### 2. 必須項目設定
```env
# .env.local
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 秘密鍵生成
```bash
# NEXTAUTH_SECRET用
openssl rand -base64 32
```

## 🔧 環境別設定

### 開発環境 (.env.local)
```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-32-chars-minimum

NEXT_PUBLIC_SUPABASE_URL=https://dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=dev-service-key
```

### 本番環境
```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=production-super-secret-key

NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key
```

## 🔒 セキュリティ方針

### 機密情報管理
- **開発**: `.env.local` (gitignore対象)
- **本番**: デプロイプラットフォーム環境変数
- **チーム**: `.env.example` テンプレート共有

### 注意事項
- `NEXT_PUBLIC_*` はブラウザ公開される
- Service Role Key はサーバーサイド専用
- `.env.local` は絶対にコミットしない

## 🚀 Supabase設定取得

### 手順
1. [Supabase Dashboard](https://supabase.com/dashboard) → プロジェクト選択
2. Settings → API から以下を取得:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: ブラウザで使用可能な公開キー
   - **service_role**: サーバーサイド専用の管理者キー

### Claude Code MCP用追加設定
```env
# Supabase MCP Server用
SUPABASE_PROJECT_ID=your-project-id
```

## 🛠 デプロイプラットフォーム設定

### Vercel
```bash
# CLI設定
vercel env add NEXTAUTH_SECRET
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Netlify
```bash
# CLI設定
netlify env:set NEXTAUTH_SECRET "your-secret"
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-url"
```

## 🔍 設定確認・テスト

### 基本確認
```bash
# 環境変数表示
echo $NEXTAUTH_SECRET
echo $NEXT_PUBLIC_SUPABASE_URL

# Supabase接続テスト
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
```

### デバッグ用API (開発環境のみ)
```javascript
// pages/api/debug-env.js
export default function handler(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ 設定済み' : '❌ 未設定',
  });
}
```

## 🐛 トラブルシューティング

### よくあるエラー
```bash
# Error: NEXTAUTH_SECRET未設定
→ .env.localでNEXTAUTH_SECRET設定

# Error: Invalid API key  
→ Supabaseキー・URL確認

# 環境変数が読み込まれない
→ サーバー再起動、ファイル名確認
```

### 解決手順
1. `.env.local` ファイル存在確認
2. 環境変数名のタイポ確認
3. 開発サーバー再起動
4. Supabaseプロジェクト設定確認

## 📁 ファイル管理

```
.env.example         # テンプレート (コミット対象)
.env.local          # 開発環境 (.gitignore)
.env.production     # 本番環境 (.gitignore)
.gitignore          # 環境変数ファイル除外設定
```

## 🎯 ベストプラクティス

### 開発フロー
1. **テンプレートコピー**: `cp .env.example .env.local`
2. **値設定**: 実際のSupabase情報入力
3. **秘密鍵生成**: `openssl rand -base64 32`
4. **動作確認**: 開発サーバー起動・接続テスト

### 本番デプロイ
1. **環境分離**: 開発・本番で異なるSupabaseプロジェクト
2. **秘密鍵更新**: 環境ごとに異なる秘密鍵使用
3. **権限最小化**: 必要最小限の権限のみ付与

---

*適切な環境変数設定により、セキュアで効率的な開発環境を構築できます*