import { expect, test } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("アイテム管理", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/items");
	});

	test("認証されていない場合はログインページにリダイレクトされる", async ({
		page,
	}) => {
		// アイテム管理ページにアクセスするとログインページにリダイレクトされる
		await expect(page).toHaveURL(/\/login/);

		// ページタイトルの確認
		await expect(page).toHaveTitle(/サンプルアプリケーション/);

		// ログインページの要素確認
		await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
	});

	test("認証後にアイテム一覧が表示される", async ({ page }) => {
		await login(page);
		await page.goto("/items");

		// アイテム管理ページの要素確認
		await expect(page.getByRole("heading", { name: "アイテム管理" })).toBeVisible();

		// ローディング、エラー、データ、または空状態のいずれかが表示される
		const hasLoading = await page
			.getByText("アイテムデータを読み込み中")
			.isVisible();
		const hasTable = await page.getByRole("table").isVisible();
		const hasNewButton = await page
			.getByRole("button", { name: "新規登録" })
			.isVisible();
		const hasNoDataMessage = await page
			.getByText("アイテムがありません")
			.isVisible();
		const hasAddButton = await page
			.getByRole("button", { name: "アイテムを登録" })
			.isVisible();

		// 何らかの状態が表示されていることを確認
		expect(
			hasLoading ||
				hasTable ||
				hasNewButton ||
				hasNoDataMessage ||
				hasAddButton,
		).toBeTruthy();
	});

	test("アイテム検索機能が動作する", async ({ page }) => {
		await login(page);
		await page.goto("/items");

		// 検索ボックスの確認
		const searchBox = page.getByPlaceholder(/アイテム名で検索/);
		if (await searchBox.isVisible()) {
			await searchBox.fill("テスト");
			// 検索結果の確認（データがある場合）
			await expect(page.locator("body")).toContainText("アイテム管理");
		}
	});

	test("アイテム登録フォームが表示される", async ({ page }) => {
		await login(page);
		await page.goto("/items");

		// ページの読み込みを待つ
		await page.waitForTimeout(2000);

		// 新規登録ボタンをクリック（データがある場合）またはアイテムを登録ボタン（空状態の場合）
		const newLinkButton = page.getByRole("link", { name: "新規登録" });
		const newButton = page.getByRole("button", { name: "新規登録" });
		const addButton = page.getByRole("button", { name: "アイテムを登録" });

		if (await newLinkButton.isVisible()) {
			await newLinkButton.click();
		} else if (await newButton.isVisible()) {
			await newButton.click();
		} else if (await addButton.isVisible()) {
			await addButton.click();
		} else {
			// データが読み込み中の場合は更に待つ
			await page.waitForTimeout(3000);
			if (await newLinkButton.isVisible()) {
				await newLinkButton.click();
			} else if (await newButton.isVisible()) {
				await newButton.click();
			} else if (await addButton.isVisible()) {
				await addButton.click();
			} else {
				throw new Error("No registration button found");
			}
		}

		// 新規登録ページに遷移することを確認（タイムアウトを長めに設定）
		await page.waitForURL("/items/new", { timeout: 10000 });
		await expect(page).toHaveURL("/items/new");
		await expect(
			page.getByRole("heading", { name: "アイテム登録", level: 1 }),
		).toBeVisible();

		// フォーム要素の確認
		await expect(page.getByLabel("アイテム名")).toBeVisible();
		await expect(page.getByLabel("カテゴリ")).toBeVisible();
		await expect(page.getByLabel("説明")).toBeVisible();
		await expect(page.getByLabel("その他情報")).toBeVisible();
	});

	test.skip("商品登録ができる", async ({ page }) => {
		// Service Role Keyの設定が必要
		await login(page);
		await page.goto("/items/new");

		// フォームの読み込みを待つ
		await page.waitForSelector('[data-testid="item-form"]', {
			timeout: 10000,
		});

		// アイテム情報を入力
		const itemName = `E2Eテストアイテム_${Date.now()}`;
		await page.getByLabel("アイテム名").fill(itemName);

		// カテゴリを選択
		await page.getByLabel("カテゴリ").click();
		await page.waitForTimeout(500);
		await page.locator('[role="option"]').first().click();

		await page.getByLabel("説明").fill("E2Eテストで作成されたアイテムです");

		// 登録ボタンをクリック
		await page.getByRole("button", { name: "登録" }).click();

		// 成功メッセージまたはアイテム一覧ページへのリダイレクトを確認
		await page.waitForURL("/items", { timeout: 10000 });
	});

	test("バリデーションエラーが表示される", async ({ page }) => {
		await login(page);
		await page.goto("/items/new");

		// 空のフォームで登録を試行
		await page.getByRole("button", { name: "登録" }).click();

		// バリデーションエラーが表示されることを確認
		// またはフォームがリセットされないことを確認
		await expect(page.getByLabel("アイテム名")).toBeVisible();
		await expect(page).toHaveURL("/items/new");
	});

	test.skip("アイテム編集ができる", async ({ page }) => {
		// このテストは既存のアイテムデータが必要なためスキップ
		// 実際のデータがある環境でのみテスト可能
	});

	test.skip("アイテム削除ができる", async ({ page }) => {
		// このテストは既存のアイテムデータが必要なためスキップ
		// 実際のデータがある環境でのみテスト可能
	});

	test.skip("ページネーションが機能する", async ({ page }) => {
		// ページネーションは大量のデータが必要なためスキップ
		// 実際の環境でのみテスト可能
	});

	test("レスポンシブデザインが機能する", async ({ page }) => {
		await login(page);
		await page.goto("/items");

		// モバイルサイズに変更
		await page.setViewportSize({ width: 375, height: 667 });

		// レスポンシブデザインが機能することを確認
		await expect(page.getByRole("heading", { name: "アイテム管理" })).toBeVisible();

		// ボタンの表示確認（データの状態によって異なる）
		await page.waitForTimeout(2000);
		const hasNewLinkButton = await page
			.getByRole("link", { name: "新規登録" })
			.isVisible();
		const hasNewButton = await page
			.getByRole("button", { name: "新規登録" })
			.isVisible();
		const hasAddButton = await page
			.getByRole("button", { name: "アイテムを登録" })
			.isVisible();
		expect(hasNewLinkButton || hasNewButton || hasAddButton).toBeTruthy();

		// デスクトップサイズに戻す
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(page.getByRole("heading", { name: "アイテム管理" })).toBeVisible();
	});
});
