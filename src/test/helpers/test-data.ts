import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Item = Database["public"]["Tables"]["items"]["Row"];

/**
 * E2Eテスト用のテストデータ管理ヘルパー
 * サンプルアプリケーション用のテストデータを管理
 */
export class TestDataManager {
	private supabase: ReturnType<typeof createClient<Database>> | null = null;

	constructor() {
		// Playwright実行環境をチェック（NODE_ENVはPlaywrightでは設定されない場合がある）
		const isPlaywrightTest =
			process.env.TEST_MODE === "e2e" ||
			process.env.PLAYWRIGHT_TEST_BASE_URL ||
			process.env.PW_TEST ||
			typeof globalThis.expect?.extend === "function";

		if (!isPlaywrightTest && process.env.NODE_ENV === "production") {
			throw new Error(
				"TestDataManager cannot be used in production environment",
			);
		}
	}

	private getSupabaseClient() {
		if (!this.supabase) {
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
			const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

			if (!supabaseUrl || !supabaseServiceKey) {
				throw new Error("Missing Supabase environment variables for testing");
			}

			this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			});
		}
		return this.supabase;
	}

	/**
	 * テストデータのセットアップ
	 */
	async setupTestData() {
		const supabase = this.getSupabaseClient();

		// 1. テストカテゴリの作成
		const testCategories = [
			{
				id: "test-cat-1",
				name: "サンプルカテゴリ1",
				description: "テスト用のカテゴリ1",
			},
			{
				id: "test-cat-2",
				name: "サンプルカテゴリ2",
				description: "テスト用のカテゴリ2",
			},
			{
				id: "test-cat-3",
				name: "サンプルカテゴリ3",
				description: "テスト用のカテゴリ3",
			},
		];

		const { error: categoriesError } = await supabase
			.from("categories")
			.upsert(testCategories, { onConflict: "id" });

		if (categoriesError) {
			console.error("Failed to setup test categories:", categoriesError);
			throw categoriesError;
		}

		// 2. テストアイテムの作成
		const testItems = [
			{
				id: "test-item-1",
				name: "サンプルアイテムA",
				category_id: "test-cat-1",
				description: "E2Eテスト用のサンプルアイテムA",
				created_by: "test-user",
				updated_by: "test-user",
			},
			{
				id: "test-item-2",
				name: "サンプルアイテムB",
				category_id: "test-cat-2",
				description: "E2Eテスト用のサンプルアイテムB",
				created_by: "test-user",
				updated_by: "test-user",
			},
			{
				id: "test-item-3",
				name: "サンプルアイテムC",
				category_id: "test-cat-3",
				description: "E2Eテスト用のサンプルアイテムC",
				created_by: "test-user",
				updated_by: "test-user",
			},
		];

		const { error: itemsError } = await supabase
			.from("items")
			.upsert(testItems, { onConflict: "id" });

		if (itemsError) {
			console.error("Failed to setup test items:", itemsError);
			throw itemsError;
		}

		console.log("✅ Test data setup completed");
		return {
			categories: testCategories,
			items: testItems,
		};
	}

	/**
	 * テストデータのクリーンアップ
	 */
	async cleanupTestData() {
		const supabase = this.getSupabaseClient();

		try {
			// 外部キー制約を考慮して順番に削除
			// 1. アイテムを削除
			await supabase.from("items").delete().like("id", "test-%");

			// 2. カテゴリを削除
			await supabase.from("categories").delete().like("id", "test-%");

			console.log("✅ Test data cleanup completed");
		} catch (error) {
			console.error("Failed to cleanup test data:", error);
			throw error;
		}
	}

	/**
	 * テスト用ユーザーを作成/確認
	 */
	async ensureTestUser() {
		// Note: 実際の認証ユーザー作成は複雑なので、
		// 今回はダミーのuser_idを使用
		return "test-user";
	}
}

// シングルトンインスタンス
export const testDataManager = new TestDataManager();
