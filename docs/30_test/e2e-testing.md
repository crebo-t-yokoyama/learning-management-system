# E2Eテストガイド

## 🎭 E2Eテストの基本方針

### テスト目的
- **ユーザー体験の検証**: 実際のユーザーフローをシミュレート
- **システム統合の確認**: フロントエンド・バックエンド・データベースの連携
- **クリティカルパスの保護**: 重要なビジネス機能の動作保証
- **リグレッション防止**: 既存機能の意図しない破壊を検出

### テスト戦略
- **重要フロー優先**: ユーザーの主要な操作パスを重点的にテスト
- **データ独立性**: テスト間でデータを共有しない
- **環境分離**: 本番データに影響しないテスト環境を使用
- **安定性重視**: フレイキーテストを避ける設計

## 🛠 Playwright セットアップ

### 基本設定
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
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // グローバルタイムアウト
    actionTimeout: 10000,
    navigationTimeout: 30000,
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
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
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

### テスト用環境変数
```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
NEXTAUTH_SECRET=test-secret-key
NEXTAUTH_URL=http://localhost:3000

# テスト専用のSupabaseブランチを使用推奨
SUPABASE_BRANCH=test
```

## 📝 テストユーティリティ

### テストデータ管理
```typescript
// src/__tests__/e2e/utils/test-data.ts
export class TestDataManager {
  private static instance: TestDataManager
  private createdItems: string[] = []
  
  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager()
    }
    return TestDataManager.instance
  }
  
  async createTestItem(data: {
    name: string
    description?: string
  }): Promise<string> {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session-token'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    const itemId = result.data.id
    
    this.createdItems.push(itemId)
    return itemId
  }
  
  async cleanup(): Promise<void> {
    for (const itemId of this.createdItems) {
      try {
        await fetch(`/api/items/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Cookie': 'next-auth.session-token=test-session-token'
          }
        })
      } catch (error) {
        console.error(`Failed to cleanup item ${itemId}:`, error)
      }
    }
    this.createdItems = []
  }
}

export const testData = {
  users: {
    validUser: {
      email: 'test@example.com',
      name: 'Test User'
    },
    adminUser: {
      email: 'admin@example.com',
      name: 'Admin User'
    }
  },
  items: {
    validItem: {
      name: 'E2E Test Item',
      description: 'Created by E2E test'
    },
    itemWithoutDescription: {
      name: 'Simple Test Item'
    },
    longItem: {
      name: 'Very Long Item Name That Should Be Displayed Properly',
      description: 'This is a very long description that should be handled correctly by the UI components and not cause any layout issues.'
    }
  }
}
```

### Page Object Model
```typescript
// src/__tests__/e2e/pages/login-page.ts
import { Page, Locator, expect } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator
  readonly successMessage: Locator
  
  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('[data-testid="email"]')
    this.loginButton = page.locator('[data-testid="login-button"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.successMessage = page.locator('[data-testid="success-message"]')
  }
  
  async goto(): Promise<void> {
    await this.page.goto('/login')
  }
  
  async login(email: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.loginButton.click()
  }
  
  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible()
    await expect(this.successMessage).toContainText('認証メールを送信しました')
  }
  
  async expectValidationError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible()
    await expect(this.errorMessage).toContainText('有効なメールアドレスを入力してください')
  }
}
```

```typescript
// src/__tests__/e2e/pages/items-page.ts
import { Page, Locator, expect } from '@playwright/test'

export class ItemsPage {
  readonly page: Page
  readonly createButton: Locator
  readonly searchInput: Locator
  readonly itemsTable: Locator
  readonly itemCards: Locator
  
  constructor(page: Page) {
    this.page = page
    this.createButton = page.locator('[data-testid="create-item-button"]')
    this.searchInput = page.locator('[data-testid="search-input"]')
    this.itemsTable = page.locator('[data-testid="items-table"]')
    this.itemCards = page.locator('[data-testid="item-card"]')
  }
  
  async goto(): Promise<void> {
    await this.page.goto('/items')
  }
  
  async createNewItem(): Promise<void> {
    await this.createButton.click()
    await expect(this.page).toHaveURL('/items/new')
  }
  
  async searchItems(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
  }
  
  async expectItemInList(itemName: string): Promise<void> {
    await expect(this.page.locator(`text=${itemName}`)).toBeVisible()
  }
  
  async editItem(itemId: string): Promise<void> {
    await this.page.locator(`[data-testid="edit-item-${itemId}"]`).click()
    await expect(this.page).toHaveURL(`/items/${itemId}/edit`)
  }
  
  async deleteItem(itemId: string): Promise<void> {
    await this.page.locator(`[data-testid="delete-item-${itemId}"]`).click()
    
    // 確認ダイアログ
    await expect(this.page.locator('text=削除してもよろしいですか？')).toBeVisible()
    await this.page.locator('[data-testid="confirm-delete"]').click()
  }
  
  async expectItemNotInList(itemName: string): Promise<void> {
    await expect(this.page.locator(`text=${itemName}`)).not.toBeVisible()
  }
}
```

```typescript
// src/__tests__/e2e/pages/item-form-page.ts
import { Page, Locator, expect } from '@playwright/test'

export class ItemFormPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly descriptionInput: Locator
  readonly saveButton: Locator
  readonly cancelButton: Locator
  readonly successMessage: Locator
  readonly errorMessage: Locator
  
  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('[data-testid="item-name-input"]')
    this.descriptionInput = page.locator('[data-testid="item-description-input"]')
    this.saveButton = page.locator('[data-testid="save-button"]')
    this.cancelButton = page.locator('[data-testid="cancel-button"]')
    this.successMessage = page.locator('[data-testid="success-message"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
  }
  
  async fillForm(data: { name: string; description?: string }): Promise<void> {
    await this.nameInput.fill(data.name)
    if (data.description) {
      await this.descriptionInput.fill(data.description)
    }
  }
  
  async save(): Promise<void> {
    await this.saveButton.click()
  }
  
  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }
  
  async expectValidationError(field: 'name' | 'description', message: string): Promise<void> {
    const errorLocator = this.page.locator(`[data-testid="${field}-error"]`)
    await expect(errorLocator).toBeVisible()
    await expect(errorLocator).toContainText(message)
  }
  
  async expectSaveSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible()
  }
}
```

## 🧪 基本テストシナリオ

### 認証フロー
```typescript
// src/__tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login-page'
import { testData } from './utils/test-data'

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage
  
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })
  
  test('should send authentication email for valid email', async () => {
    await loginPage.login(testData.users.validUser.email)
    await loginPage.expectSuccessMessage()
  })
  
  test('should show validation error for invalid email', async () => {
    await loginPage.login('invalid-email')
    await loginPage.expectValidationError()
  })
  
  test('should show validation error for empty email', async () => {
    await loginPage.login('')
    await loginPage.expectValidationError()
  })
  
  test('should redirect to dashboard after successful login', async ({ context }) => {
    // テスト用セッションCookieを設定
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    await loginPage.page.goto('/dashboard')
    await expect(loginPage.page).toHaveURL('/dashboard')
    await expect(loginPage.page.locator('h1')).toContainText('ダッシュボード')
  })
  
  test('should logout successfully', async ({ page, context }) => {
    // ログイン状態でテスト開始
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
    await page.locator('[data-testid="logout-button"]').click()
    
    // ログインページにリダイレクト
    await expect(page).toHaveURL('/login')
  })
})
```

### CRUD操作フロー
```typescript
// src/__tests__/e2e/items-crud.spec.ts
import { test, expect } from '@playwright/test'
import { ItemsPage } from './pages/items-page'
import { ItemFormPage } from './pages/item-form-page'
import { TestDataManager, testData } from './utils/test-data'

test.describe('Items CRUD Operations', () => {
  let itemsPage: ItemsPage
  let itemFormPage: ItemFormPage
  let testDataManager: TestDataManager
  
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
    
    itemsPage = new ItemsPage(page)
    itemFormPage = new ItemFormPage(page)
    testDataManager = TestDataManager.getInstance()
  })
  
  test.afterEach(async () => {
    await testDataManager.cleanup()
  })
  
  test('should create new item successfully', async () => {
    await itemsPage.goto()
    await itemsPage.createNewItem()
    
    // フォーム入力
    await itemFormPage.fillForm(testData.items.validItem)
    await itemFormPage.save()
    
    // 成功メッセージ確認
    await itemFormPage.expectSaveSuccess()
    
    // 一覧にアイテムが表示されることを確認
    await itemsPage.goto()
    await itemsPage.expectItemInList(testData.items.validItem.name)
  })
  
  test('should validate required fields', async () => {
    await itemsPage.goto()
    await itemsPage.createNewItem()
    
    // 空のフォームで保存試行
    await itemFormPage.save()
    
    // バリデーションエラー確認
    await itemFormPage.expectValidationError('name', '名前は必須です')
  })
  
  test('should edit existing item', async () => {
    // テストデータ作成
    const itemId = await testDataManager.createTestItem(testData.items.validItem)
    
    await itemsPage.goto()
    await itemsPage.editItem(itemId)
    
    // 名前を変更
    const updatedName = 'Updated Item Name'
    await itemFormPage.fillForm({ name: updatedName })
    await itemFormPage.save()
    
    // 更新成功確認
    await itemFormPage.expectSaveSuccess()
    
    // 一覧で変更が反映されていることを確認
    await itemsPage.goto()
    await itemsPage.expectItemInList(updatedName)
  })
  
  test('should delete item with confirmation', async () => {
    // テストデータ作成
    const itemId = await testDataManager.createTestItem(testData.items.validItem)
    
    await itemsPage.goto()
    await itemsPage.expectItemInList(testData.items.validItem.name)
    
    // 削除実行
    await itemsPage.deleteItem(itemId)
    
    // アイテムが一覧から消えることを確認
    await itemsPage.expectItemNotInList(testData.items.validItem.name)
  })
  
  test('should search items', async () => {
    // 複数のテストデータ作成
    await testDataManager.createTestItem({ name: 'Apple Product' })
    await testDataManager.createTestItem({ name: 'Banana Product' })
    await testDataManager.createTestItem({ name: 'Cherry Product' })
    
    await itemsPage.goto()
    
    // 検索実行
    await itemsPage.searchItems('Apple')
    
    // 検索結果確認
    await itemsPage.expectItemInList('Apple Product')
    await itemsPage.expectItemNotInList('Banana Product')
    await itemsPage.expectItemNotInList('Cherry Product')
  })
})
```

### レスポンシブテスト
```typescript
// src/__tests__/e2e/responsive.spec.ts
import { test, expect } from '@playwright/test'
import { ItemsPage } from './pages/items-page'

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])
  })
  
  const viewports = [
    { name: 'iPhone 5', width: 320, height: 568 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ]
  
  viewports.forEach(({ name, width, height }) => {
    test(`should work correctly on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      
      const itemsPage = new ItemsPage(page)
      await itemsPage.goto()
      
      // 基本要素が表示されることを確認
      await expect(page.locator('[data-testid="items-container"]')).toBeVisible()
      
      if (width < 768) {
        // モバイルビューでのテスト
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
        
        // モバイルメニュー操作
        await page.locator('[data-testid="mobile-menu-button"]').click()
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      } else {
        // デスクトップビューでのテスト
        await expect(page.locator('[data-testid="desktop-menu"]')).toBeVisible()
      }
      
      // 作成ボタンが適切に表示されることを確認
      await expect(itemsPage.createButton).toBeVisible()
      await expect(itemsPage.createButton).toBeEnabled()
    })
  })
  
  test('should handle orientation changes', async ({ page }) => {
    // ポートレート → ランドスケープ
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/items')
    
    await expect(page.locator('[data-testid="items-container"]')).toBeVisible()
    
    // ランドスケープに変更
    await page.setViewportSize({ width: 844, height: 390 })
    
    // レイアウトが適切に調整されることを確認
    await expect(page.locator('[data-testid="items-container"]')).toBeVisible()
  })
})
```

### パフォーマンステスト
```typescript
// src/__tests__/e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])
  })
  
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toContainText('ダッシュボード')
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // 3秒以内
  })
  
  test('should load items list efficiently', async ({ page }) => {
    await page.goto('/items')
    
    const startTime = Date.now()
    await expect(page.locator('[data-testid="items-container"]')).toBeVisible()
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(2000) // 2秒以内
  })
  
  test('should handle large data sets', async ({ page }) => {
    // 大量のデータがある場合のテスト
    await page.goto('/items?limit=100')
    
    // ページネーションが正しく機能することを確認
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    
    // スクロールパフォーマンスの確認
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    
    // スクロール後も正常に動作することを確認
    await expect(page.locator('[data-testid="items-container"]')).toBeVisible()
  })
})
```

## 🔧 テスト実行・デバッグ

### 実行コマンド
```bash
# 全てのE2Eテスト実行
pnpm test:e2e

# ヘッドレスモードで実行（デバッグ用）
pnpm test:e2e --headed

# 特定のブラウザのみ
pnpm test:e2e --project=chromium

# 特定のテストファイルのみ
pnpm test:e2e auth.spec.ts

# デバッグモード
pnpm test:e2e --debug

# UIモード
pnpm test:e2e --ui

# 並列実行を無効化（デバッグ時）
pnpm test:e2e --workers=1
```

### デバッグ技法
```typescript
// テスト中でのデバッグ
test('debug example', async ({ page }) => {
  await page.goto('/items')
  
  // ブレークポイント設定
  await page.pause()
  
  // スクリーンショット撮影
  await page.screenshot({ path: 'debug-screenshot.png' })
  
  // コンソールログ出力
  console.log('Current URL:', page.url())
  
  // ページの状態をダンプ
  const content = await page.content()
  console.log('Page content:', content)
  
  // 要素の情報取得
  const button = page.locator('[data-testid="create-button"]')
  console.log('Button visible:', await button.isVisible())
  console.log('Button enabled:', await button.isEnabled())
})
```

### CI/CD統合
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          # テスト用環境変数
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-videos
          path: test-results/
          retention-days: 7
```

## 📋 E2Eテストベストプラクティス

### テスト設計
- **独立性**: テスト間で状態を共有しない
- **冪等性**: 何度実行しても同じ結果になる
- **原子性**: 1つのテストで1つの機能のみテスト
- **説明的**: テスト名から内容が分かる

### データ管理
- **テスト専用データベース**: 本番データと分離
- **自動クリーンアップ**: テスト後にデータを削除
- **固定データ**: テスト結果が安定するようにデータを固定

### 安定性向上
- **明示的な待機**: `waitFor` を適切に使用
- **リトライ機能**: フレイキーテストに対する保険
- **タイムアウト設定**: 適切な待機時間の設定
- **エラーハンドリング**: 予期しない状況への対応

### パフォーマンス
- **並列実行**: 可能な限り並列でテスト実行
- **ブラウザ再利用**: テスト間でブラウザインスタンスを再利用
- **不要な処理削除**: テストに関係ない処理は無効化