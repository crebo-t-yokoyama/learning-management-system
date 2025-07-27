# テスト戦略

## 📋 テストピラミッド

```
        /\
       /  \
      /E2E \     少数・重要フロー
     /------\
    /  統合  \    中程度・API連携
   /--------\
  /ユニット  \   多数・個別機能
 /----------\
```

### テスト分類と目標カバレッジ

| テスト種別 | 対象 | カバレッジ目標 | 実行頻度 |
|------------|------|----------------|----------|
| ユニットテスト | 関数・コンポーネント | 80%以上 | 毎コミット |
| 統合テスト | API・DB連携 | 70%以上 | 毎PR |
| E2Eテスト | ユーザーフロー | 主要シナリオ100% | 毎リリース |

## 🧪 ユニットテスト戦略

### 対象範囲
- **ユーティリティ関数**: `src/lib/**/*.ts`
- **バリデーションスキーマ**: `src/lib/validations.ts`
- **カスタムhooks**: `src/hooks/**/*.ts`
- **ビジネスロジック**: 純粋関数・状態管理

### ツール構成
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### テスト例

#### バリデーション関数のテスト
```typescript
// __tests__/lib/validations.test.ts
import { describe, it, expect } from 'vitest'
import { itemSchema } from '@/lib/validations'

describe('itemSchema', () => {
  it('should validate valid item data', () => {
    const validItem = {
      name: 'Test Item',
      description: 'Test description'
    }
    
    const result = itemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.name).toBe('Test Item')
    }
  })
  
  it('should reject empty name', () => {
    const invalidItem = {
      name: '',
      description: 'Test description'
    }
    
    const result = itemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['name'])
    }
  })
  
  it('should handle optional description', () => {
    const itemWithoutDescription = {
      name: 'Test Item'
    }
    
    const result = itemSchema.safeParse(itemWithoutDescription)
    expect(result.success).toBe(true)
  })
})
```

#### React Component テスト
```typescript
// __tests__/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies variant classes correctly', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByText('Secondary')
    expect(button).toHaveClass('bg-secondary')
  })
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
  })
})
```

#### Custom Hook テスト
```typescript
// __tests__/hooks/use-items.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useItems } from '@/hooks/use-items'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [
            { id: '1', name: 'Item 1', description: 'Description 1' },
            { id: '2', name: 'Item 2', description: 'Description 2' }
          ],
          error: null
        }))
      }))
    }))
  }
}))

describe('useItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should fetch items successfully', async () => {
    const { result } = renderHook(() => useItems())
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })
    
    expect(result.current.data[0].name).toBe('Item 1')
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
```

## 🔗 統合テスト戦略

### 対象範囲
- **API Routes**: HTTP リクエスト・レスポンス
- **データベース連携**: CRUD操作・RLS
- **認証フロー**: ログイン・セッション管理
- **外部サービス連携**: Supabase API

### API Routes テスト例
```typescript
// __tests__/api/items.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/items/route'
import { getServerSession } from 'next-auth'

// 認証をモック
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Supabaseをモック
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [{ id: '1', name: 'Test Item' }],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '1', name: 'New Item' },
            error: null
          }))
        }))
      }))
    }))
  }
}))

describe('/api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('GET', () => {
    it('should return 401 without authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)
      
      const { req } = createMocks({ method: 'GET' })
      const response = await GET(req as any)
      
      expect(response.status).toBe(401)
    })
    
    it('should return items for authenticated user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1' }
      } as any)
      
      const { req } = createMocks({ method: 'GET' })
      const response = await GET(req as any)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Test Item')
    })
  })
  
  describe('POST', () => {
    it('should create item with valid data', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1' }
      } as any)
      
      const { req } = createMocks({
        method: 'POST',
        body: {
          name: 'New Item',
          description: 'New Description'
        }
      })
      
      const response = await POST(req as any)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.data.name).toBe('New Item')
    })
    
    it('should return 400 for invalid data', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1' }
      } as any)
      
      const { req } = createMocks({
        method: 'POST',
        body: {
          name: '' // 空の名前（無効）
        }
      })
      
      const response = await POST(req as any)
      
      expect(response.status).toBe(400)
    })
  })
})
```

### データベース統合テスト
```typescript
// __tests__/integration/database.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase'

describe('Database Integration', () => {
  let testItemId: string
  
  beforeEach(async () => {
    // テストデータクリーンアップ
    await supabaseAdmin
      .from('items')
      .delete()
      .like('name', 'Test%')
  })
  
  afterEach(async () => {
    // テストデータクリーンアップ
    if (testItemId) {
      await supabaseAdmin
        .from('items')
        .delete()
        .eq('id', testItemId)
    }
  })
  
  it('should create and retrieve item', async () => {
    // 作成
    const { data: created, error: createError } = await supabaseAdmin
      .from('items')
      .insert({
        name: 'Test Item',
        description: 'Test Description'
      })
      .select()
      .single()
    
    expect(createError).toBeNull()
    expect(created).toBeTruthy()
    testItemId = created!.id
    
    // 取得
    const { data: retrieved, error: selectError } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', testItemId)
      .single()
    
    expect(selectError).toBeNull()
    expect(retrieved!.name).toBe('Test Item')
  })
  
  it('should enforce unique constraints', async () => {
    // 同じ名前のアイテムを2つ作成（制約がある場合）
    const itemData = {
      name: 'Unique Test Item',
      description: 'Test'
    }
    
    const { error: firstError } = await supabaseAdmin
      .from('items')
      .insert(itemData)
    
    expect(firstError).toBeNull()
    
    const { error: secondError } = await supabaseAdmin
      .from('items')
      .insert(itemData)
    
    // 制約がある場合はエラーが発生することを確認
    // 実際の制約設定に応じて調整
  })
})
```

## 🎭 E2Eテスト戦略

### 対象シナリオ
1. **認証フロー**: 登録・ログイン・ログアウト
2. **基本CRUD**: アイテム作成・編集・削除
3. **検索・フィルタ**: データ検索・ソート
4. **エラーハンドリング**: ネットワークエラー・バリデーションエラー

### Playwright 設定
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

### E2Eテスト例

#### 認証フロー
```typescript
// __tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should complete login flow', async ({ page }) => {
    // ログインページに移動
    await page.goto('/login')
    
    // フォーム入力
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.click('[data-testid="login-button"]')
    
    // 認証メール送信成功メッセージ確認
    await expect(page.locator('text=認証メールを送信しました')).toBeVisible()
  })
  
  test('should handle invalid email', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'invalid-email')
    await page.click('[data-testid="login-button"]')
    
    // バリデーションエラー表示
    await expect(page.locator('text=有効なメールアドレスを入力してください')).toBeVisible()
  })
  
  test('should logout successfully', async ({ page, context }) => {
    // ログイン状態でテスト開始（セッションCookie設定）
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    await page.goto('/dashboard')
    
    // ログアウト
    await page.click('[data-testid="logout-button"]')
    
    // ログインページにリダイレクト
    await expect(page).toHaveURL('/login')
  })
})
```

#### CRUD操作フロー
```typescript
// __tests__/e2e/items.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Items Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // 認証状態をセットアップ
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])
  })
  
  test('should create new item', async ({ page }) => {
    await page.goto('/items')
    
    // 新規作成ボタンクリック
    await page.click('[data-testid="create-item-button"]')
    
    // フォーム入力
    await page.fill('[data-testid="item-name"]', 'E2E Test Item')
    await page.fill('[data-testid="item-description"]', 'Created by E2E test')
    
    // 保存
    await page.click('[data-testid="save-button"]')
    
    // 成功メッセージ確認
    await expect(page.locator('text=アイテムを作成しました')).toBeVisible()
    
    // 一覧にアイテムが表示されることを確認
    await page.goto('/items')
    await expect(page.locator('text=E2E Test Item')).toBeVisible()
  })
  
  test('should edit existing item', async ({ page }) => {
    // 既存アイテムの編集ボタンクリック
    await page.goto('/items')
    await page.click('[data-testid="edit-item-1"]')
    
    // 名前を変更
    await page.fill('[data-testid="item-name"]', 'Updated Item Name')
    await page.click('[data-testid="save-button"]')
    
    // 更新成功確認
    await expect(page.locator('text=アイテムを更新しました')).toBeVisible()
  })
  
  test('should delete item with confirmation', async ({ page }) => {
    await page.goto('/items')
    
    // 削除ボタンクリック
    await page.click('[data-testid="delete-item-1"]')
    
    // 確認ダイアログ
    await expect(page.locator('text=削除してもよろしいですか？')).toBeVisible()
    await page.click('[data-testid="confirm-delete"]')
    
    // 削除成功確認
    await expect(page.locator('text=アイテムを削除しました')).toBeVisible()
  })
})
```

#### レスポンシブテスト
```typescript
// __tests__/e2e/responsive.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/dashboard')
    
    // モバイルメニューが表示されることを確認
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // デスクトップメニューが非表示であることを確認
    await expect(page.locator('[data-testid="desktop-menu"]')).toBeHidden()
  })
  
  test('should handle different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },  // iPhone 5
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 } // Desktop
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/items')
      
      // レイアウトが適切に表示されることを確認
      await expect(page.locator('[data-testid="items-container"]')).toBeVisible()
      
      // テーブルがレスポンシブであることを確認
      if (viewport.width < 768) {
        // モバイルビューではカード表示
        await expect(page.locator('[data-testid="items-cards"]')).toBeVisible()
      } else {
        // デスクトップビューではテーブル表示
        await expect(page.locator('[data-testid="items-table"]')).toBeVisible()
      }
    }
  })
})
```

## 📊 テスト実行・レポート

### スクリプト設定
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "pnpm test:coverage && pnpm test:e2e"
  }
}
```

### CI/CD統合
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  e2e-test:
    runs-on: ubuntu-latest
    needs: unit-test
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 テストベストプラクティス

### ユニットテスト
- **単一責任**: 1つのテストで1つの機能のみテスト
- **独立性**: テスト間で状態を共有しない
- **明確な命名**: テスト内容が分かる名前を付ける
- **AAA パターン**: Arrange・Act・Assert の構造

### E2Eテスト
- **Page Object パターン**: 再利用可能なページ操作を抽象化
- **データ独立性**: テスト用データは毎回クリーンアップ
- **安定性重視**: フレイキーテストを避ける設計
- **スクリーンショット**: 失敗時の状況を記録

### テストデータ管理
```typescript
// __tests__/fixtures/test-data.ts
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@example.com',
    name: 'Admin User'
  }
}

export const testItems = {
  validItem: {
    name: 'Test Item',
    description: 'Test Description'
  },
  itemWithoutDescription: {
    name: 'Simple Item'
  }
}
```

### モック戦略
```typescript
// __tests__/mocks/supabase.ts
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({
        data: [],
        error: null
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: {},
          error: null
        }))
      }))
    }))
  }))
}
```