# API設計

## 📋 設計原則

### RESTful設計
- **リソース指向**: URLはリソースを表現
- **HTTPメソッド**: 操作を適切に分離
- **ステートレス**: セッション状態を持たない
- **統一インターフェース**: 一貫したレスポンス形式

### セキュリティファースト
- **認証必須**: すべてのAPIエンドポイントで認証チェック
- **認可制御**: リソースレベルでのアクセス制御
- **入力検証**: Zodによる厳密なバリデーション
- **レート制限**: API乱用防止

## 🛣 エンドポイント設計

### 汎用CRUDパターン

#### アイテム管理API
サンプルアプリケーションでの汎用的なアイテム管理機能。

```typescript
// GET /api/items - アイテム一覧取得
interface GetItemsParams {
  page?: number      // ページ番号（デフォルト: 1）
  limit?: number     // 取得件数（デフォルト: 10, 最大: 100）
  search?: string    // 検索キーワード
  sort?: 'name' | 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
}

interface GetItemsResponse {
  data: Item[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// POST /api/items - アイテム作成
interface CreateItemRequest {
  name: string
  description?: string
}

interface CreateItemResponse {
  data: Item
}

// GET /api/items/[id] - アイテム詳細取得
interface GetItemResponse {
  data: Item
}

// PUT /api/items/[id] - アイテム更新
interface UpdateItemRequest {
  name?: string
  description?: string
}

interface UpdateItemResponse {
  data: Item
}

// DELETE /api/items/[id] - アイテム削除
interface DeleteItemResponse {
  success: boolean
}
```

### API実装例

#### 一覧取得（GET /api/items）
```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

const GetItemsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sort: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // パラメータ検証
    const { searchParams } = new URL(request.url)
    const params = GetItemsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    })

    // ベースクエリ
    let query = supabaseAdmin
      .from('items')
      .select('*, created_by!inner(name)', { count: 'exact' })

    // 検索条件
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }

    // ソート
    query = query.order(params.sort, { ascending: params.order === 'asc' })

    // ページネーション
    const offset = (params.page - 1) * params.limit
    query = query.range(offset, offset + params.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / params.limit)

    return NextResponse.json({
      data: data || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages,
      },
    })

  } catch (error) {
    console.error('GET /api/items error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### 作成（POST /api/items）
```typescript
const CreateItemSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreateItemSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .from('items')
      .insert({
        ...validatedData,
        created_by: session.user.id,
        updated_by: session.user.id,
      })
      .select('*, created_by!inner(name)')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(
      { data },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/items error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### 詳細取得・更新・削除（/api/items/[id]）
```typescript
// app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/items/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // UUID検証
    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*, created_by!inner(name)')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        )
      }
      throw new Error(error.message)
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error(`GET /api/items/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/items/[id]
const UpdateItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateItemSchema.parse(body)

    // 更新データがない場合
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('items')
      .update({
        ...validatedData,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('*, created_by!inner(name)')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        )
      }
      throw new Error(error.message)
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error(`PUT /api/items/${params.id} error:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(`DELETE /api/items/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UUID検証ユーティリティ
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
```

## 🔒 認証・認可

### 認証ミドルウェア
```typescript
// lib/auth-middleware.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new AuthError('Authentication required', 401)
  }
  
  return session
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'AuthError'
  }
}

// API Routeでの使用
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    // 認証済み処理
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    throw error
  }
}
```

### リソース認可
```typescript
// lib/authorization.ts
export async function canAccessItem(userId: string, itemId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('items')
    .select('created_by')
    .eq('id', itemId)
    .single()
  
  return data?.created_by === userId
}

export async function requireItemAccess(userId: string, itemId: string) {
  const canAccess = await canAccessItem(userId, itemId)
  
  if (!canAccess) {
    throw new AuthError('Access denied to this resource', 403)
  }
}

// 使用例
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request)
  await requireItemAccess(session.user.id, params.id)
  
  // 認可済み処理
}
```

## 📊 エラーハンドリング

### 統一エラーレスポンス
```typescript
// types/api.ts
interface ApiError {
  error: string
  code?: string
  details?: any
  timestamp?: string
}

interface ApiSuccess<T> {
  data: T
  message?: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiError
```

### エラーハンドラー
```typescript
// lib/api-error-handler.ts
export function createErrorResponse(
  error: unknown,
  defaultMessage = 'Internal server error'
): NextResponse {
  console.error('API Error:', error)
  
  // 認証エラー
  if (error instanceof AuthError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: 'AUTH_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: error.statusCode }
    )
  }
  
  // バリデーションエラー
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }
  
  // Supabaseエラー
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    return NextResponse.json(
      {
        error: supabaseError.message || defaultMessage,
        code: supabaseError.code,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
  
  // 一般エラー
  return NextResponse.json(
    {
      error: defaultMessage,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  )
}

// 使用例
export async function GET(request: NextRequest) {
  try {
    // API処理
  } catch (error) {
    return createErrorResponse(error)
  }
}
```

## 🚀 パフォーマンス最適化

### クエリ最適化
```typescript
// 効率的なデータ取得
export async function GET(request: NextRequest) {
  // Select specific columns
  const { data } = await supabaseAdmin
    .from('items')
    .select('id, name, created_at, created_by(name)')  // 必要な列のみ
    .order('created_at', { ascending: false })
    .limit(10)
  
  return NextResponse.json({ data })
}

// バッチ処理
export async function POST(request: NextRequest) {
  const items = await request.json()
  
  // 一括挿入
  const { data } = await supabaseAdmin
    .from('items')
    .insert(items)
    .select()
  
  return NextResponse.json({ data })
}
```

### キャッシング
```typescript
// Next.js Cache API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cacheKey = `items-${searchParams.toString()}`
  
  // キャッシュ確認
  const cached = await cache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }
  
  // データ取得
  const { data } = await supabaseAdmin
    .from('items')
    .select('*')
  
  // キャッシュ保存（5分）
  await cache.set(cacheKey, { data }, 300)
  
  return NextResponse.json({ data })
}

// レスポンスヘッダーでのキャッシュ制御
export async function GET() {
  const response = NextResponse.json({ data })
  
  response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate')
  
  return response
}
```

## 📈 API監視・ログ

### リクエストログ
```typescript
// lib/api-logger.ts
export function logApiRequest(
  method: string,
  url: string,
  userId?: string,
  duration?: number
) {
  const logData = {
    timestamp: new Date().toISOString(),
    method,
    url,
    userId,
    duration,
  }
  
  console.log('API Request:', logData)
  
  // 本番環境では外部ログサービスに送信
  if (process.env.NODE_ENV === 'production') {
    // Datadog, CloudWatch等に送信
  }
}

// API Routeでの使用
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await requireAuth(request)
    // API処理
    
    const duration = Date.now() - startTime
    logApiRequest('GET', request.url, session.user.id, duration)
    
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    logApiRequest('GET', request.url, undefined, duration)
    throw error
  }
}
```

### レート制限
```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimitMap = new Map()

export function rateLimit(identifier: string, limit = 100, window = 60000) {
  const now = Date.now()
  const windowStart = now - window
  
  const requests = rateLimitMap.get(identifier) || []
  const recentRequests = requests.filter((time: number) => time > windowStart)
  
  if (recentRequests.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  recentRequests.push(now)
  rateLimitMap.set(identifier, recentRequests)
}

// API Routeでの使用
export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  
  // ユーザーごとのレート制限
  rateLimit(session.user.id, 50, 60000) // 1分間に50リクエスト
  
  // API処理
}
```

## 📋 テスト戦略

### API テスト
```typescript
// __tests__/api/items.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/items/route'

describe('/api/items', () => {
  it('should return 401 without auth', async () => {
    const { req } = createMocks({ method: 'GET' })
    const response = await GET(req as any)
    
    expect(response.status).toBe(401)
  })
  
  it('should create item with valid data', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { name: 'Test Item' }
    })
    
    // モック認証セッション
    jest.spyOn(require('next-auth'), 'getServerSession')
      .mockResolvedValue({ user: { id: 'user-id' } })
    
    const response = await POST(req as any)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.data.name).toBe('Test Item')
  })
})
```