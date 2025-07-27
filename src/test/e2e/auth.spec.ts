import { expect, test } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("認証機能", () => {
	test.beforeEach(async ({ page }) => {
		// 各テスト前にセッションをクリア
		await page.context().clearCookies();
	});

	test("ログインページが正しく表示される", async ({ page }) => {
		await page.goto("/login");

		// ページタイトルの確認
		await expect(page).toHaveTitle(/サンプルアプリケーション/);

		// ログインフォームの要素確認
		await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "アプリケーション", exact: true }),
		).toBeVisible();
		await expect(page.getByText("認証が必要です")).toBeVisible();

		// フォーム要素の確認
		await expect(page.getByLabel("メールアドレス")).toBeVisible();
		await expect(page.getByLabel("パスワード")).toBeVisible();
		await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
	});

	test("正しい認証情報でログインできる", async ({ page }) => {
		await page.goto("/login");

		// ログイン情報を入力
		await page.getByLabel("メールアドレス").fill("admin@example.com");
		await page.getByLabel("パスワード").fill("password123");

		// ログインボタンをクリック
		await page.getByRole("button", { name: "ログイン" }).click();

		// ダッシュボードにリダイレクトされることを確認（タイムアウトを長めに設定）
		await page.waitForURL("/dashboard", { timeout: 15000 });
		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();
	});

	test("間違った認証情報でログインできない", async ({ page }) => {
		await page.goto("/login");

		// 間違った認証情報を入力
		await page.getByLabel("メールアドレス").fill("wrong@example.com");
		await page.getByLabel("パスワード").fill("wrongpassword");

		// ログインボタンをクリック
		await page.getByRole("button", { name: "ログイン" }).click();

		// ログインページに留まることを確認
		await expect(page).toHaveURL(/\/login/);

		// エラーメッセージまたはログインフォームが再表示されることを確認
		await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
	});

	test("必須フィールドのバリデーションが動作する", async ({ page }) => {
		await page.goto("/login");

		// 空のフォームでログインを試行
		await page.getByRole("button", { name: "ログイン" }).click();

		// ログインページに留まることを確認
		await expect(page).toHaveURL(/\/login/);
	});

	test("認証済みユーザーがダッシュボードにアクセスできる", async ({ page }) => {
		// ログインヘルパーを使用
		await login(page);

		// ダッシュボードにアクセスできることを確認
		await expect(page).toHaveURL("/dashboard");
		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
		).toBeVisible();
	});

	test("認証済みユーザーがアイテム管理にアクセスできる", async ({ page }) => {
		await login(page);

		// アイテム管理ページにアクセス
		await page.goto("/items");
		await expect(page).toHaveURL("/items");
		await expect(
			page.getByRole("heading", { name: "アイテム管理" }),
		).toBeVisible();
	});

	test("未認証ユーザーは保護されたページにアクセスできない", async ({
		page,
	}) => {
		// セッションをクリア
		await page.context().clearCookies();

		// 保護されたページにアクセスを試行
		const protectedRoutes = ["/dashboard", "/items"];

		for (const route of protectedRoutes) {
			await page.goto(route);
			// ログインページにリダイレクトされることを確認
			await expect(page).toHaveURL(/\/login/);
			await expect(
				page.getByRole("heading", { name: "ログイン" }),
			).toBeVisible();
		}
	});

	test("ナビゲーションが認証状態で正しく動作する", async ({ page }) => {
		await login(page);

		// ナビゲーションリンクの確認
		await expect(
			page.getByRole("link", { name: "ダッシュボード" }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "アイテム管理" }),
		).toBeVisible();

		// アイテム管理へのナビゲーション
		await page.getByRole("link", { name: "アイテム管理" }).click();
		await page.waitForURL("/items", { timeout: 10000 });
		await expect(page).toHaveURL("/items");

		// ダッシュボードへのナビゲーション
		await page.getByRole("link", { name: "ダッシュボード" }).click();
		await page.waitForURL("/dashboard", { timeout: 10000 });
		await expect(page).toHaveURL("/dashboard");
	});
});
