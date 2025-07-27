# セキュリティガイド

## 🔐 基本セキュリティ原則

### 1. 最小権限の原則
- ユーザーには必要最小限の権限のみ付与
- データベースアクセスは行レベルで制御
- API Routesでの適切な認証・認可チェック

### 2. 深層防御
- 複数のセキュリティ層を重ねる
- フロントエンド・バックエンド両方での検証
- 入力検証・出力エスケープの徹底

### 3. セキュアバイデザイン
- 設計段階からセキュリティを考慮
- デフォルトでセキュアな設定
- 明示的な権限付与

## 🛡 認証・認可

### Auth.js設定
```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { SupabaseAdapter } from '@auth/supabase-adapter'

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    // プロバイダー設定
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  callbacks: {
    session: async ({ session, token }) => {
      // セッションにユーザーIDを追加
      if (token && session.user) {
        session.user.id = token.sub!
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login?error=true',
  },
}
```

### セッション管理
```typescript
// API Routeでの認証チェック
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 認証済み処理
}

// Server Componentでの認証チェック
import { redirect } from 'next/navigation'

async function ProtectedPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return <div>Protected content</div>
}
```

## 🔒 データベースセキュリティ

### Row Level Security (RLS)
```sql
-- すべてのテーブルでRLS有効化
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーのみアクセス可能
CREATE POLICY "認証ユーザーは自分のデータのみ操作可能" ON items
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    (created_by = auth.uid() OR updated_by = auth.uid())
  );

-- 読み取り専用ポリシー
CREATE POLICY "認証ユーザーは全てのアイテムを閲覧可能" ON items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 管理者ポリシー（必要に応じて）
CREATE POLICY "管理者は全ての操作が可能" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### パラメータ化クエリ
```typescript
// ❌ 危険: SQLインジェクション脆弱性
const { data } = await supabase
  .from('items')
  .select('*')
  .eq('name', userInput) // ユーザー入力をそのまま使用

// ✅ 安全: Supabaseクライアントは自動的にエスケープ
const { data } = await supabase
  .from('items')
  .select('*')
  .eq('name', userInput) // Supabaseが自動的にサニタイズ

// ❌ 生SQLは避ける
const { data } = await supabase.rpc('custom_query', {
  sql: `SELECT * FROM items WHERE name = '${userInput}'`
})

// ✅ 生SQLを使う場合はパラメータ化
const { data } = await supabase.rpc('safe_query', {
  item_name: userInput
})
```

## 🔍 入力検証

### Zodバリデーション
```typescript
// src/lib/validations.ts
import { z } from 'zod'

// 基本的な入力検証
export const itemSchema = z.object({
  name: z
    .string({ message: '名前は必須です' })
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください')
    .regex(/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-_]+$/, 
           '使用できない文字が含まれています'),
  
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional()
    .transform(val => val?.trim()),
  
  // XSS対策: HTMLタグを除去
  content: z
    .string()
    .transform(val => val.replace(/<[^>]*>/g, ''))
    .optional(),
})

// API Routeでの使用
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = itemSchema.parse(body)
    
    // バリデーション済みデータを使用
    const { data, error } = await supabase
      .from('items')
      .insert(validatedData)
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'サーバーエラー' },
      { status: 500 }
    )
  }
}
```

### サニタイゼーション
```typescript
// HTMLエスケープ
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// URLサニタイゼーション
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '#'
    }
    return parsed.toString()
  } catch {
    return '#'
  }
}
```

## 🚫 XSS対策

### React自動エスケープ
```typescript
// ✅ 自動的にエスケープされる
function UserProfile({ user }: { user: User }) {
  return <div>{user.name}</div> // 安全
}

// ❌ 危険: dangerouslySetInnerHTML
function UnsafeComponent({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />
}

// ✅ サニタイズライブラリ使用
import DOMPurify from 'isomorphic-dompurify'

function SafeComponent({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content)
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

### Content Security Policy (CSP)
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  }
}
```

## 🛠 セキュリティヘッダー

### 必須ヘッダー設定
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 🔐 環境変数・シークレット管理

### 環境変数の分類
```typescript
// ✅ パブリック（フロントエンドで使用可能）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

// ✅ プライベート（サーバーサイドのみ）
NEXTAUTH_SECRET=your-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// ❌ 機密情報をパブリックにしない
NEXT_PUBLIC_SECRET_KEY=xxx // 危険!
```

### 本番環境の注意点
```bash
# 開発用の値を本番で使わない
NEXTAUTH_SECRET=development-secret # ❌
NEXTAUTH_SECRET=$(openssl rand -base64 32) # ✅

# 強力な値を生成
openssl rand -base64 32
```

## 🔍 セキュリティテスト

### 基本チェックリスト
- [ ] 認証なしでAPIにアクセスできないか
- [ ] 他ユーザーのデータにアクセスできないか
- [ ] SQLインジェクション脆弱性はないか
- [ ] XSS脆弱性はないか
- [ ] CSRF保護は有効か
- [ ] セキュリティヘッダーは設定されているか
- [ ] HTTPS接続が強制されているか
- [ ] 機密情報がログに出力されていないか

### 自動セキュリティテスト
```typescript
// __tests__/security/auth.test.ts
import { test, expect } from '@playwright/test'

test.describe('認証セキュリティ', () => {
  test('未認証でAPI呼び出し時は401を返す', async ({ request }) => {
    const response = await request.get('/api/items')
    expect(response.status()).toBe(401)
  })
  
  test('無効なトークンでAPI呼び出し時は401を返す', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    })
    expect(response.status()).toBe(401)
  })
})
```

## 📋 セキュリティ監査

### 定期チェック項目
1. **依存関係の脆弱性チェック**
   ```bash
   pnpm audit
   pnpm audit fix
   ```

2. **セキュリティヘッダーの確認**
   ```bash
   curl -I https://your-domain.com
   ```

3. **SSL/TLS設定の確認**
   - SSL Labs でテスト
   - 証明書の有効期限確認

4. **ログの監視**
   - 不正アクセスの検出
   - エラー率の監視
   - 異常なトラフィックパターンの検出

### 脆弱性対応フロー
1. **検出**: セキュリティスキャン・報告
2. **評価**: 影響範囲・深刻度の判定
3. **対応**: パッチ適用・回避策実装
4. **テスト**: 修正内容の検証
5. **デプロイ**: 本番環境への適用
6. **監視**: 再発防止の確認