import { describe, expect, it } from "vitest";
import {
	emailSchema,
	type ItemSchema,
	itemSchema,
	type LoginSchema,
	loginSchema,
	positiveNumberSchema,
	requiredStringSchema,
	uuidSchema,
} from "@/lib/validations";

describe("Validation Schemas", () => {
	describe("loginSchema", () => {
		it("正常なログインデータをバリデーションできる", () => {
			const validLogin: LoginSchema = {
				email: "test@example.com",
				password: "password123",
			};

			const result = loginSchema.safeParse(validLogin);
			expect(result.success).toBe(true);
		});

		it("無効なメールアドレスの場合エラーを返す", () => {
			const invalidLogin = {
				email: "invalid-email",
				password: "password123",
			};

			const result = loginSchema.safeParse(invalidLogin);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("email")),
				).toBe(true);
			}
		});

		it("パスワードが短い場合エラーを返す", () => {
			const invalidLogin = {
				email: "test@example.com",
				password: "12345",
			};

			const result = loginSchema.safeParse(invalidLogin);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("password")),
				).toBe(true);
			}
		});
	});

	describe("itemSchema", () => {
		it("正常なアイテムデータをバリデーションできる", () => {
			const validItem: ItemSchema = {
				name: "テストアイテム",
				description: "テスト用アイテム説明",
			};

			const result = itemSchema.safeParse(validItem);
			expect(result.success).toBe(true);
		});

		it("名前が空の場合エラーを返す", () => {
			const invalidItem = {
				name: "",
				description: "テスト用アイテム説明",
			};

			const result = itemSchema.safeParse(invalidItem);
			expect(result.success).toBe(false);
		});

		it("説明はオプションなので省略可能", () => {
			const validItem = {
				name: "テストアイテム",
			};

			const result = itemSchema.safeParse(validItem);
			expect(result.success).toBe(true);
		});
	});

	describe("ヘルパースキーマ", () => {
		it("uuidSchemaが正しいUUIDを受け入れる", () => {
			const validUuid = "123e4567-e89b-12d3-a456-426614174000";
			const result = uuidSchema.safeParse(validUuid);
			expect(result.success).toBe(true);
		});

		it("uuidSchemaが無効なUUIDを拒否する", () => {
			const invalidUuid = "invalid-uuid";
			const result = uuidSchema.safeParse(invalidUuid);
			expect(result.success).toBe(false);
		});

		it("emailSchemaが正しいメールアドレスを受け入れる", () => {
			const validEmail = "test@example.com";
			const result = emailSchema.safeParse(validEmail);
			expect(result.success).toBe(true);
		});

		it("positiveNumberSchemaが正の数値を受け入れる", () => {
			const result = positiveNumberSchema.safeParse(10);
			expect(result.success).toBe(true);
		});

		it("positiveNumberSchemaが負の数値を拒否する", () => {
			const result = positiveNumberSchema.safeParse(-5);
			expect(result.success).toBe(false);
		});

		it("requiredStringSchemaが空でない文字列を受け入れる", () => {
			const result = requiredStringSchema.safeParse("テスト");
			expect(result.success).toBe(true);
		});

		it("requiredStringSchemaが空文字列を拒否する", () => {
			const result = requiredStringSchema.safeParse("");
			expect(result.success).toBe(false);
		});
	});
});
