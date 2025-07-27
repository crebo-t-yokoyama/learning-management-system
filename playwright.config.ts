import { defineConfig, devices } from "@playwright/test";

// テスト環境変数を設定
process.env.TEST_MODE = "e2e";

export default defineConfig({
	testDir: "./src/test/e2e",
	timeout: 30 * 1000,
	expect: {
		timeout: 5000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : 4, // 並列実行数を4に固定
	reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
	// グローバルセットアップ（必要に応じて有効化）
	// globalSetup: require.resolve('./src/test/setup/global-setup'),
	// globalTeardown: require.resolve('./src/test/setup/global-teardown'),
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		video: "retain-on-failure", // 失敗時のみ録画を保存（推奨）
		screenshot: "only-on-failure", // 失敗時のみスクリーンショット
		headless: true, // 依存関係問題回避のためヘッドレスモード
	},

	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				headless: true,
			},
		},
		// 他のブラウザはコメントアウト（依存関係問題があるため）
		// {
		//   name: 'firefox',
		//   use: { ...devices['Desktop Firefox'] },
		// },
		// {
		//   name: 'webkit',
		//   use: { ...devices['Desktop Safari'] },
		// },
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },
	],

	// 開発サーバーの起動
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 20 * 1000, // 2分でタイムアウト
	},
});
