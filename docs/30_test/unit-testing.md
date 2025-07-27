# ユニットテストガイド

## 🧪 ユニットテストの基本方針

### テスト対象の優先順位
1. **高優先度**: ビジネスロジック・バリデーション・ユーティリティ関数
2. **中優先度**: カスタムhooks・複雑なコンポーネント
3. **低優先度**: UI コンポーネント・スタイリング

### カバレッジ目標
- **関数カバレッジ**: 80%以上
- **分岐カバレッジ**: 80%以上
- **行カバレッジ**: 80%以上
- **重要機能**: 100%

## 🛠 テスト環境セットアップ

### Vitest設定
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
        '**/*.config.*',
        'src/app/**/*.tsx', // App Router pages
        'src/components/ui/**', // shadcn/ui components
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

### テストセットアップファイル
```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})

// グローバルモック設定
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ResizeObserver モック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// IntersectionObserver モック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

## 🔧 ユーティリティ関数のテスト

### バリデーション関数
```typescript
// src/lib/validations.ts
import { z } from 'zod'

export const itemSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
  price: z.number().min(0, '価格は0以上で入力してください').optional(),
})

export const emailSchema = z.string().email('有効なメールアドレスを入力してください')

export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(price)
}
```

```typescript
// __tests__/lib/validations.test.ts
import { describe, it, expect } from 'vitest'
import { itemSchema, emailSchema, validateEmail, formatPrice } from '@/lib/validations'

describe('itemSchema', () => {
  it('should validate valid item data', () => {
    const validItem = {
      name: 'Test Item',
      description: 'Test description',
      price: 1000
    }
    
    const result = itemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.name).toBe('Test Item')
      expect(result.data.price).toBe(1000)
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
      expect(result.error.errors[0].message).toBe('名前は必須です')
    }
  })
  
  it('should reject name longer than 100 characters', () => {
    const longName = 'a'.repeat(101)
    const invalidItem = {
      name: longName
    }
    
    const result = itemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('名前は100文字以内で入力してください')
    }
  })
  
  it('should handle optional description', () => {
    const itemWithoutDescription = {
      name: 'Test Item'
    }
    
    const result = itemSchema.safeParse(itemWithoutDescription)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.description).toBeUndefined()
    }
  })
  
  it('should reject negative price', () => {
    const invalidItem = {
      name: 'Test Item',
      price: -100
    }
    
    const result = itemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('価格は0以上で入力してください')
    }
  })
})

describe('emailSchema', () => {
  it('should validate correct email', () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.org',
      'user+tag@example.co.jp'
    ]
    
    validEmails.forEach(email => {
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(true)
    })
  })
  
  it('should reject invalid email', () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test@.com',
      ''
    ]
    
    invalidEmails.forEach(email => {
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(false)
    })
  })
})

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true)
  })
  
  it('should return false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false)
  })
})

describe('formatPrice', () => {
  it('should format price in Japanese yen', () => {
    expect(formatPrice(1000)).toBe('￥1,000')
    expect(formatPrice(0)).toBe('￥0')
    expect(formatPrice(1234567)).toBe('￥1,234,567')
  })
  
  it('should handle decimal prices', () => {
    expect(formatPrice(1000.5)).toBe('￥1,001') // 小数点は四捨五入
  })
})
```

### 日付・文字列操作関数
```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatDateTime, truncateText, sleep } from '@/lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })
  
  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class')
    expect(cn('base-class', false && 'conditional-class')).toBe('base-class')
  })
  
  it('should merge tailwind classes', () => {
    // twMergeが重複するクラスをマージすることを確認
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })
})

describe('formatDate', () => {
  it('should format Date object', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('2024/01/15')
  })
  
  it('should format date string', () => {
    expect(formatDate('2024-01-15')).toBe('2024/01/15')
  })
  
  it('should handle different date formats', () => {
    expect(formatDate('2024-1-5')).toBe('2024/01/05')
    expect(formatDate('2024/1/5')).toBe('2024/01/05')
  })
})

describe('formatDateTime', () => {
  it('should format date and time', () => {
    const date = new Date('2024-01-15T10:30:00')
    expect(formatDateTime(date)).toBe('2024/01/15 10:30')
  })
  
  it('should handle string input', () => {
    expect(formatDateTime('2024-01-15T10:30:00')).toBe('2024/01/15 10:30')
  })
})

describe('truncateText', () => {
  it('should truncate long text', () => {
    const longText = 'This is a very long text that should be truncated'
    expect(truncateText(longText, 20)).toBe('This is a very long ...')
  })
  
  it('should not truncate short text', () => {
    const shortText = 'Short text'
    expect(truncateText(shortText, 20)).toBe('Short text')
  })
  
  it('should handle exact length', () => {
    const text = 'Exactly twenty chars'
    expect(truncateText(text, 20)).toBe('Exactly twenty chars')
  })
  
  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('')
  })
})

describe('sleep', () => {
  it('should wait for specified time', async () => {
    const start = Date.now()
    await sleep(100)
    const end = Date.now()
    
    expect(end - start).toBeGreaterThanOrEqual(100)
    expect(end - start).toBeLessThan(150) // 許容誤差
  })
})
```

## ⚛️ React Hooks のテスト

### カスタムhooks
```typescript
// src/hooks/use-local-storage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }
  
  return [storedValue, setValue]
}
```

```typescript
// __tests__/hooks/use-local-storage.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLocalStorage } from '@/hooks/use-local-storage'

// localStorage をモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })
  
  it('should return stored value from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('"stored value"')
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('stored value')
  })
  
  it('should update localStorage when value changes', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('new value')
    })
    
    expect(result.current[0]).toBe('new value')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new value"')
  })
  
  it('should handle JSON parse errors', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })
  
  it('should handle localStorage setItem errors', () => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('new value')
    })
    
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
  
  it('should work with object values', () => {
    const initialObject = { name: 'test', count: 0 }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(initialObject))
    
    const { result } = renderHook(() => useLocalStorage('test-object', {}))
    
    expect(result.current[0]).toEqual(initialObject)
    
    const newObject = { name: 'updated', count: 1 }
    act(() => {
      result.current[1](newObject)
    })
    
    expect(result.current[0]).toEqual(newObject)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-object', JSON.stringify(newObject))
  })
})
```

### データフェッチhooks
```typescript
// src/hooks/use-items.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Item = Database['public']['Tables']['items']['Row']

interface UseItemsResult {
  items: Item[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useItems(): UseItemsResult {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        throw fetchError
      }
      
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchItems()
  }, [])
  
  return {
    items,
    loading,
    error,
    refresh: fetchItems
  }
}
```

```typescript
// __tests__/hooks/use-items.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useItems } from '@/hooks/use-items'

// Supabaseクライアントをモック
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({
        data: [
          { id: '1', name: 'Item 1', description: 'Description 1', created_at: '2024-01-01' },
          { id: '2', name: 'Item 2', description: 'Description 2', created_at: '2024-01-02' }
        ],
        error: null
      }))
    }))
  }))
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

describe('useItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should fetch items successfully', async () => {
    const { result } = renderHook(() => useItems())
    
    // 初期状態
    expect(result.current.loading).toBe(true)
    expect(result.current.items).toEqual([])
    expect(result.current.error).toBeNull()
    
    // データ取得完了を待機
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[0].name).toBe('Item 1')
    expect(result.current.error).toBeNull()
  })
  
  it('should handle fetch errors', async () => {
    // エラーを発生させるモック
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' }
        }))
      }))
    })
    
    const { result } = renderHook(() => useItems())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.error).toBe('Database error')
    expect(result.current.items).toEqual([])
  })
  
  it('should refresh items when refresh is called', async () => {
    const { result } = renderHook(() => useItems())
    
    // 初回取得完了を待機
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // 新しいデータを設定
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [
            { id: '3', name: 'New Item', description: 'New Description', created_at: '2024-01-03' }
          ],
          error: null
        }))
      }))
    })
    
    // refresh実行
    await result.current.refresh()
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].name).toBe('New Item')
  })
})
```

## 🎨 React Component のテスト

### 基本コンポーネント
```typescript
// src/components/item-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface ItemCardProps {
  item: {
    id: string
    name: string
    description?: string
    created_at: string
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  return (
    <Card data-testid={`item-card-${item.id}`}>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        {item.description && (
          <CardDescription>{item.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          作成日: {formatDate(item.created_at)}
        </p>
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item.id)}
              data-testid={`edit-button-${item.id}`}
            >
              編集
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(item.id)}
              data-testid={`delete-button-${item.id}`}
            >
              削除
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

```typescript
// __tests__/components/item-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ItemCard } from '@/components/item-card'

const mockItem = {
  id: '1',
  name: 'Test Item',
  description: 'Test Description',
  created_at: '2024-01-15T10:30:00Z'
}

describe('ItemCard', () => {
  it('renders item information', () => {
    render(<ItemCard item={mockItem} />)
    
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('作成日: 2024/01/15')).toBeInTheDocument()
  })
  
  it('renders without description', () => {
    const itemWithoutDescription = { ...mockItem, description: undefined }
    render(<ItemCard item={itemWithoutDescription} />)
    
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<ItemCard item={mockItem} onEdit={onEdit} />)
    
    const editButton = screen.getByTestId('edit-button-1')
    fireEvent.click(editButton)
    
    expect(onEdit).toHaveBeenCalledWith('1')
  })
  
  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<ItemCard item={mockItem} onDelete={onDelete} />)
    
    const deleteButton = screen.getByTestId('delete-button-1')
    fireEvent.click(deleteButton)
    
    expect(onDelete).toHaveBeenCalledWith('1')
  })
  
  it('does not render buttons when handlers are not provided', () => {
    render(<ItemCard item={mockItem} />)
    
    expect(screen.queryByTestId('edit-button-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-button-1')).not.toBeInTheDocument()
  })
  
  it('has correct test id', () => {
    render(<ItemCard item={mockItem} />)
    
    expect(screen.getByTestId('item-card-1')).toBeInTheDocument()
  })
})
```

### フォームコンポーネント
```typescript
// src/components/item-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { itemSchema } from '@/lib/validations'
import type { z } from 'zod'

type ItemFormData = z.infer<typeof itemSchema>

interface ItemFormProps {
  initialData?: Partial<ItemFormData>
  onSubmit: (data: ItemFormData) => Promise<void>
  loading?: boolean
}

export function ItemForm({ initialData, onSubmit, loading = false }: ItemFormProps) {
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    }
  })
  
  const handleSubmit = async (data: ItemFormData) => {
    try {
      await onSubmit(data)
      if (!initialData) {
        form.reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名前</FormLabel>
              <FormControl>
                <Input
                  placeholder="アイテム名を入力"
                  data-testid="item-name-input"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>説明</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="説明を入力（任意）"
                  data-testid="item-description-input"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </form>
    </Form>
  )
}
```

```typescript
// __tests__/components/item-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ItemForm } from '@/components/item-form'

describe('ItemForm', () => {
  it('renders form fields', () => {
    const onSubmit = vi.fn()
    render(<ItemForm onSubmit={onSubmit} />)
    
    expect(screen.getByTestId('item-name-input')).toBeInTheDocument()
    expect(screen.getByTestId('item-description-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })
  
  it('populates form with initial data', () => {
    const initialData = {
      name: 'Initial Name',
      description: 'Initial Description'
    }
    const onSubmit = vi.fn()
    
    render(<ItemForm initialData={initialData} onSubmit={onSubmit} />)
    
    expect(screen.getByDisplayValue('Initial Name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Initial Description')).toBeInTheDocument()
  })
  
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ItemForm onSubmit={onSubmit} />)
    
    // フォーム入力
    fireEvent.change(screen.getByTestId('item-name-input'), {
      target: { value: 'Test Item' }
    })
    fireEvent.change(screen.getByTestId('item-description-input'), {
      target: { value: 'Test Description' }
    })
    
    // 送信
    fireEvent.click(screen.getByTestId('submit-button'))
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Item',
        description: 'Test Description'
      })
    })
  })
  
  it('shows validation errors for invalid data', async () => {
    const onSubmit = vi.fn()
    render(<ItemForm onSubmit={onSubmit} />)
    
    // 空の名前で送信
    fireEvent.click(screen.getByTestId('submit-button'))
    
    await waitFor(() => {
      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
    })
    
    expect(onSubmit).not.toHaveBeenCalled()
  })
  
  it('shows loading state when submitting', () => {
    const onSubmit = vi.fn()
    render(<ItemForm onSubmit={onSubmit} loading={true} />)
    
    const submitButton = screen.getByTestId('submit-button')
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('保存中...')).toBeInTheDocument()
  })
  
  it('resets form after successful submission when no initial data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ItemForm onSubmit={onSubmit} />)
    
    // フォーム入力
    const nameInput = screen.getByTestId('item-name-input')
    fireEvent.change(nameInput, { target: { value: 'Test Item' } })
    
    // 送信
    fireEvent.click(screen.getByTestId('submit-button'))
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    
    // フォームがリセットされることを確認
    await waitFor(() => {
      expect(nameInput).toHaveValue('')
    })
  })
  
  it('does not reset form when editing existing item', async () => {
    const initialData = { name: 'Existing Item' }
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ItemForm initialData={initialData} onSubmit={onSubmit} />)
    
    const nameInput = screen.getByTestId('item-name-input')
    fireEvent.change(nameInput, { target: { value: 'Updated Item' } })
    fireEvent.click(screen.getByTestId('submit-button'))
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    
    // フォームがリセットされないことを確認
    expect(nameInput).toHaveValue('Updated Item')
  })
})
```

## 📊 テスト実行・レポート

### テスト実行コマンド
```bash
# 全てのテスト実行
pnpm test

# ウォッチモード
pnpm test --watch

# カバレッジレポート生成
pnpm test --coverage

# 特定のファイルのみテスト
pnpm test utils.test.ts

# テストUIで実行
pnpm test:ui
```

### カバレッジレポートの確認
```bash
# HTMLレポート生成
pnpm test --coverage

# カバレッジレポートを開く
open coverage/index.html
```

### CIでのテスト実行
```yaml
# .github/workflows/test.yml
name: Unit Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test --coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```