import type { FullConfig } from "@playwright/test";
import { testDataManager } from "../helpers/test-data";

/**
 * Playwrightグローバルセットアップ
 * 全テスト実行前に一度だけ実行される
 */
async function globalSetup(_config: FullConfig) {
	console.log("🚀 Starting E2E test global setup...");

	try {
		// テストデータのセットアップ
		await testDataManager.setupTestData();

		// テスト用ユーザーの確認
		await testDataManager.ensureTestUser();

		console.log("✅ Global setup completed successfully");
	} catch (error) {
		console.error("❌ Global setup failed:", error);
		throw error;
	}
}

export default globalSetup;
