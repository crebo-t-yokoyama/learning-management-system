# コーディング規約

## 📋 基本方針

### 1. 一貫性の原則
- チーム全体で統一されたコードスタイル
- 自動化ツールによる品質保証
- 可読性・保守性の優先

### 2. 品質優先
- TypeScript strict mode
- Biome による自動フォーマット
- 包括的なテストカバレッジ

## 🎯 命名規約

### ファイル・ディレクトリ
```
kebab-case: components/user-profile.tsx
PascalCase: components/UserProfile.tsx (React components)
camelCase: utils/formatDate.ts
UPPER_CASE: constants/API_ENDPOINTS.ts
```

### 変数・関数
```typescript
// 変数: camelCase
const userName = 'john'
const isAuthenticated = true

// 関数: camelCase + 動詞から開始
function fetchUserData() { }
function handleSubmit() { }

// 定数: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRY_COUNT = 3

// 型: PascalCase
interface UserProfile { }
type ApiResponse<T> = { }
```

### React コンポーネント
```typescript
// コンポーネント: PascalCase
function UserProfile() { }
export default UserProfile

// Props: [ComponentName]Props
interface UserProfileProps {
  user: User
  onUpdate: (user: User) => void
}

// Hooks: use[FunctionName]
function useUserProfile(id: string) { }
```

## 🗂 ファイル構成

### プロジェクト構造
```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Route groups
│   ├── api/            # API Routes
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── custom/        # Project-specific components
├── lib/               # Utilities & configurations
├── types/             # TypeScript type definitions
└── hooks/             # Custom React hooks
```

### インポート順序
```typescript
// 1. React & Next.js
import React from 'react'
import { NextRequest } from 'next/server'

// 2. External libraries
import { z } from 'zod'
import { clsx } from 'clsx'

// 3. Internal modules (absolute imports)
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

// 4. Relative imports
import './styles.css'
```

## 💻 TypeScript規約

### 基本設定
```typescript
// strict mode必須
"strict": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true
```

### 型定義
```typescript
// Interface vs Type
interface User {           // オブジェクト形状の定義
  id: string
  name: string
}

type Status = 'pending' | 'success' | 'error'  // Union types

// Generics
interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

// Utility Types活用
type PartialUser = Partial<User>
type UserName = Pick<User, 'name'>
```

### 関数定義
```typescript
// 関数: 戻り値の型を明示
function fetchUser(id: string): Promise<User> {
  return api.get(`/users/${id}`)
}

// Arrow function
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// Component props
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  // ...
}
```

## 🎨 React規約

### Component設計
```typescript
// 1. Functional Components優先
function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>
}

// 2. Props destructuring
function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button className={cn('btn', className)} {...props}>
      {children}
    </button>
  )
}

// 3. Early return pattern
function UserProfile({ userId }: { userId?: string }) {
  if (!userId) {
    return <div>User ID is required</div>
  }
  
  return <div>User profile content</div>
}
```

### Hooks使用
```typescript
// カスタムフック: 責務の分離
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUser(id).then(setUser).finally(() => setLoading(false))
  }, [id])
  
  return { user, loading }
}

// useCallback: 依存配列の適切な管理
const handleSubmit = useCallback(
  (data: FormData) => {
    onSubmit(data)
  },
  [onSubmit]
)
```

## 🔧 API設計

### Route Handlers
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateUserSchema.parse(body)
    
    // Process data...
    
    return NextResponse.json({ user: result })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
```

### エラーハンドリング
```typescript
// 統一されたエラーレスポンス
interface ApiError {
  error: string
  code?: string
  details?: unknown
}

// エラー処理関数
function handleApiError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.errors },
      { status: 400 }
    )
  }
  
  console.error('API Error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

## 🧪 テスト規約

### ユニットテスト
```typescript
// utils/formatDate.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01')
    expect(formatDate(date)).toBe('2024-01-01')
  })
  
  it('should handle invalid dates', () => {
    expect(() => formatDate(null as any)).toThrow()
  })
})
```

### E2Eテスト
```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
  })
})
```

## 📝 コメント規約

### JSDoc
```typescript
/**
 * ユーザー情報を取得する
 * @param id - ユーザーID
 * @returns ユーザー情報のPromise
 * @throws {Error} ユーザーが見つからない場合
 */
async function fetchUser(id: string): Promise<User> {
  // 実装...
}
```

### TODO/FIXME
```typescript
// TODO: パフォーマンス改善が必要
// FIXME: エラーハンドリングが不十分
// NOTE: この実装は一時的なもの
```

## 🚀 パフォーマンス

### React最適化
```typescript
// memo: 不要な再レンダリング防止
const UserCard = memo(function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>
})

// lazy: 動的インポート
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Suspense: ローディング状態
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

### 画像最適化
```typescript
// next/image使用必須
import Image from 'next/image'

function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full"
    />
  )
}
```