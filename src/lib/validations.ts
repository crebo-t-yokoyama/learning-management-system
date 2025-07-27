import { z } from "zod";

// ログインフォーム
export const loginSchema = z.object({
	email: z
		.string({ message: "メールアドレスは必須です" })
		.email("正しいメールアドレスを入力してください"),
	password: z
		.string({ message: "パスワードは必須です" })
		.min(6, "パスワードは6文字以上で入力してください"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// 汎用的なアイテム登録・編集（プロジェクトに応じてカスタマイズ）
export const itemSchema = z.object({
	name: z.string({ message: "名前は必須です" }).min(1, "名前は必須です"),
	category_id: z.string({ message: "カテゴリは必須です" }).min(1, "カテゴリは必須です"),
	description: z.string().optional(),
	metadata: z.string().optional(),
});

export type ItemSchema = z.infer<typeof itemSchema>;

// よく使われる基本的なバリデーション関数
export const uuidSchema = z.string().uuid("正しいIDを指定してください");
export const emailSchema = z
	.string()
	.email("正しいメールアドレスを入力してください");
export const positiveNumberSchema = z
	.number()
	.min(0, "0以上の数値を入力してください");
export const requiredStringSchema = z.string().min(1, "この項目は必須です");
