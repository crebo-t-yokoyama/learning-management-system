import { z } from "zod";

// 基本的なバリデーション関数
export const uuidSchema = z.string().uuid("正しいIDを指定してください");
export const emailSchema = z
	.string()
	.email("正しいメールアドレスを入力してください");
export const positiveNumberSchema = z
	.number()
	.min(0, "0以上の数値を入力してください");
export const requiredStringSchema = z.string().min(1, "この項目は必須です");
export const optionalStringSchema = z.string().optional();
export const optionalStringSchemaWithMax = (maxLength: number, message: string) => 
	z.string().max(maxLength, message).optional();
export const datetimeSchema = z.string().datetime("正しい日時形式を入力してください");
export const percentageSchema = z.number().min(0, "0以上で入力してください").max(100, "100以下で入力してください");

// Enum型のバリデーション
export const userRoleSchema = z.enum(["admin", "learner"] as const);
export const difficultyLevelSchema = z.enum(["beginner", "intermediate", "advanced"] as const);
export const enrollmentStatusSchema = z.enum(["assigned", "in_progress", "completed", "cancelled"] as const);
export const understandingLevelSchema = z.union([
	z.literal(1),
	z.literal(2), 
	z.literal(3),
	z.literal(4),
	z.literal(5)
]);

// ============= 認証関連 =============

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

// ============= ユーザー管理 =============

// ユーザー作成スキーマ
export const userCreateSchema = z.object({
	email: emailSchema,
	name: requiredStringSchema.max(100, "名前は100文字以内で入力してください"),
	full_name: optionalStringSchemaWithMax(100, "フルネームは100文字以内で入力してください"),
	department: optionalStringSchemaWithMax(100, "部署名は100文字以内で入力してください"),
	position: optionalStringSchemaWithMax(100, "役職は100文字以内で入力してください"),
	role: userRoleSchema,
	hire_date: z.string().date("正しい日付形式を入力してください").optional(),
	password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export type UserCreateSchema = z.infer<typeof userCreateSchema>;

// ユーザー更新スキーマ
export const userUpdateSchema = z.object({
	name: optionalStringSchemaWithMax(100, "名前は100文字以内で入力してください"),
	full_name: optionalStringSchemaWithMax(100, "フルネームは100文字以内で入力してください"),
	department: optionalStringSchemaWithMax(100, "部署名は100文字以内で入力してください"),
	position: optionalStringSchemaWithMax(100, "役職は100文字以内で入力してください"),
	role: userRoleSchema.optional(),
	hire_date: z.string().date("正しい日付形式を入力してください").optional(),
});

export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;

// ユーザー一覧取得クエリパラメータ
export const userListQuerySchema = z.object({
	page: z.coerce.number().min(1, "ページ番号は1以上で指定してください").default(1),
	limit: z.coerce.number().min(1, "件数は1以上で指定してください").max(100, "件数は100以下で指定してください").default(20),
	role: userRoleSchema.optional(),
	department: optionalStringSchema,
	search: optionalStringSchema,
	sort: z.enum(["name", "email", "department", "created_at", "last_login_at"]).default("created_at"),
	order: z.enum(["asc", "desc"]).default("desc"),
});

export type UserListQuerySchema = z.infer<typeof userListQuerySchema>;

// ユーザーパスワード更新スキーマ
export const passwordSchema = z.string().min(8, "パスワードは8文字以上で入力してください");
export const passwordConfirmSchema = z.object({
	password: passwordSchema,
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "パスワードが一致しません",
	path: ["confirmPassword"],
});

export const userPasswordUpdateSchema = passwordConfirmSchema;

export type UserPasswordUpdateSchema = z.infer<typeof userPasswordUpdateSchema>;

// ============= コース管理 =============

// コース作成スキーマ
export const courseCreateSchema = z.object({
	title: requiredStringSchema.max(200, "タイトルは200文字以内で入力してください"),
	overview: optionalStringSchemaWithMax(500, "概要は500文字以内で入力してください"),
	description: optionalStringSchema,
	category: optionalStringSchemaWithMax(100, "カテゴリは100文字以内で入力してください"),
	difficulty_level: difficultyLevelSchema,
	estimated_hours: z.number().min(0.1, "推定時間は0.1時間以上で入力してください").max(1000, "推定時間は1000時間以下で入力してください"),
	is_active: z.boolean().default(true),
});

export type CourseCreateSchema = z.infer<typeof courseCreateSchema>;

// コース更新スキーマ
export const courseUpdateSchema = z.object({
	title: optionalStringSchemaWithMax(200, "タイトルは200文字以内で入力してください"),
	overview: optionalStringSchemaWithMax(500, "概要は500文字以内で入力してください"),
	description: optionalStringSchema,
	category: optionalStringSchemaWithMax(100, "カテゴリは100文字以内で入力してください"),
	difficulty_level: difficultyLevelSchema.optional(),
	estimated_hours: z.number().min(0.1, "推定時間は0.1時間以上で入力してください").max(1000, "推定時間は1000時間以下で入力してください").optional(),
	is_active: z.boolean().optional(),
});

export type CourseUpdateSchema = z.infer<typeof courseUpdateSchema>;

// コース一覧取得クエリパラメータ
export const courseListQuerySchema = z.object({
	page: z.coerce.number().min(1, "ページ番号は1以上で指定してください").default(1),
	limit: z.coerce.number().min(1, "件数は1以上で指定してください").max(100, "件数は100以下で指定してください").default(20),
	category: optionalStringSchema,
	difficulty_level: difficultyLevelSchema.optional(),
	is_active: z.coerce.boolean().optional(),
	search: optionalStringSchema,
	sort: z.enum(["title", "category", "difficulty_level", "estimated_hours", "created_at", "updated_at"]).default("created_at"),
	order: z.enum(["asc", "desc"]).default("desc"),
});

export type CourseListQuerySchema = z.infer<typeof courseListQuerySchema>;

// ============= 受講者割り当て管理 =============

// 受講者割り当て作成スキーマ
export const enrollmentCreateSchema = z.object({
	learner_id: uuidSchema,
	course_id: uuidSchema,
	due_date: z.string().date("正しい日付形式を入力してください").optional(),
	status: enrollmentStatusSchema.default("assigned"),
});

export type EnrollmentCreateSchema = z.infer<typeof enrollmentCreateSchema>;

// 受講者割り当て更新スキーマ
export const enrollmentUpdateSchema = z.object({
	progress_percentage: percentageSchema.optional(),
	status: enrollmentStatusSchema.optional(),
	due_date: z.string().date("正しい日付形式を入力してください").optional(),
	started_at: datetimeSchema.optional(),
	completed_at: datetimeSchema.optional(),
});

export type EnrollmentUpdateSchema = z.infer<typeof enrollmentUpdateSchema>;

// 受講者割り当て一覧取得クエリパラメータ
export const enrollmentListQuerySchema = z.object({
	page: z.coerce.number().min(1, "ページ番号は1以上で指定してください").default(1),
	limit: z.coerce.number().min(1, "件数は1以上で指定してください").max(100, "件数は100以下で指定してください").default(20),
	learner_id: uuidSchema.optional(),
	course_id: uuidSchema.optional(),
	status: enrollmentStatusSchema.optional(),
	assigned_by: uuidSchema.optional(),
	sort: z.enum(["assigned_at", "started_at", "completed_at", "progress_percentage", "status"]).default("assigned_at"),
	order: z.enum(["asc", "desc"]).default("desc"),
});

export type EnrollmentListQuerySchema = z.infer<typeof enrollmentListQuerySchema>;

// ============= 学習記録管理 =============

// 学習記録作成スキーマ
export const learningRecordCreateSchema = z.object({
	enrollment_id: uuidSchema,
	course_id: uuidSchema,
	learner_id: uuidSchema,
	session_start_time: datetimeSchema,
	session_end_time: datetimeSchema.optional(),
	session_duration_minutes: z.number().min(1, "学習時間は1分以上で入力してください").max(1440, "学習時間は1日(1440分)以下で入力してください").optional(),
	progress_percentage: percentageSchema.optional(),
	understanding_level: understandingLevelSchema.optional(),
	learning_memo: z.string().max(1000, "学習メモは1000文字以内で入力してください").optional(),
});

export type LearningRecordCreateSchema = z.infer<typeof learningRecordCreateSchema>;

// 学習記録更新スキーマ
export const learningRecordUpdateSchema = z.object({
	session_end_time: datetimeSchema.optional(),
	session_duration_minutes: z.number().min(1, "学習時間は1分以上で入力してください").max(1440, "学習時間は1日(1440分)以下で入力してください").optional(),
	progress_percentage: percentageSchema.optional(),
	understanding_level: understandingLevelSchema.optional(),
	learning_memo: z.string().max(1000, "学習メモは1000文字以内で入力してください").optional(),
});

export type LearningRecordUpdateSchema = z.infer<typeof learningRecordUpdateSchema>;

// 学習記録一覧取得クエリパラメータ
export const learningRecordListQuerySchema = z.object({
	page: z.coerce.number().min(1, "ページ番号は1以上で指定してください").default(1),
	limit: z.coerce.number().min(1, "件数は1以上で指定してください").max(100, "件数は100以下で指定してください").default(20),
	learner_id: uuidSchema.optional(),
	course_id: uuidSchema.optional(),
	enrollment_id: uuidSchema.optional(),
	date_from: z.string().date("正しい日付形式を入力してください").optional(),
	date_to: z.string().date("正しい日付形式を入力してください").optional(),
	sort: z.enum(["session_date", "session_start_time", "session_duration_minutes", "progress_percentage", "understanding_level"]).default("session_start_time"),
	order: z.enum(["asc", "desc"]).default("desc"),
});

export type LearningRecordListQuerySchema = z.infer<typeof learningRecordListQuerySchema>;

// ============= 統計・レポート =============

// 統計取得クエリパラメータ
export const statisticsQuerySchema = z.object({
	date_from: z.string().date("正しい日付形式を入力してください").optional(),
	date_to: z.string().date("正しい日付形式を入力してください").optional(),
	department: optionalStringSchema,
	category: optionalStringSchema,
	difficulty_level: difficultyLevelSchema.optional(),
});

export type StatisticsQuerySchema = z.infer<typeof statisticsQuerySchema>;

// レポート取得クエリパラメータ
export const reportQuerySchema = z.object({
	format: z.enum(["json", "csv"]).default("json"),
	date_from: z.string().date("正しい日付形式を入力してください").optional(),
	date_to: z.string().date("正しい日付形式を入力してください").optional(),
	learner_id: uuidSchema.optional(),
	course_id: uuidSchema.optional(),
	department: optionalStringSchema,
	category: optionalStringSchema,
});

export type ReportQuerySchema = z.infer<typeof reportQuerySchema>;

// 一括操作用のスキーマ
export const bulkDeleteSchema = z.object({
	ids: z.array(uuidSchema).min(1, "削除対象を選択してください"),
});

export type BulkDeleteSchema = z.infer<typeof bulkDeleteSchema>;

// エラーレスポンス用の型
export interface ValidationErrorResponse {
	error: string;
	details?: Record<string, string[]>;
}

// 成功レスポンス用の型
export interface SuccessResponse<T = unknown> {
	success: true;
	data: T;
	meta?: {
		total?: number;
		page?: number;
		limit?: number;
		totalPages?: number;
	};
}

// ページネーション用のメタデータ型
export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

// ============= 汎用的なアイテム（既存のため保持） =============

// 汎用的なアイテム登録・編集（プロジェクトに応じてカスタマイズ）
export const itemSchema = z.object({
	name: z.string({ message: "名前は必須です" }).min(1, "名前は必須です"),
	category_id: z.string({ message: "カテゴリは必須です" }).min(1, "カテゴリは必須です"),
	description: z.string().optional(),
	metadata: z.string().optional(),
});

export type ItemSchema = z.infer<typeof itemSchema>;
