import type { FullConfig } from "@playwright/test";
import { testDataManager } from "../helpers/test-data";

/**
 * Playwrightグローバルティアダウン
 * 全テスト実行後に一度だけ実行される
 */
async function globalTeardown(_config: FullConfig) {
	console.log("🧹 Starting E2E test global teardown...");

	try {
		// テストデータのクリーンアップ
		await testDataManager.cleanupTestData();

		console.log("✅ Global teardown completed successfully");
	} catch (error) {
		console.error("❌ Global teardown failed:", error);
		// ティアダウンの失敗はテスト結果に影響させない
		console.error("Warning: Test data may not have been cleaned up properly");
	}
}

export default globalTeardown;
