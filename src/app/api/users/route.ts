import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAdminAuth } from "@/lib/auth-helpers";
import {
	userCreateSchema,
	userListQuerySchema,
	type UserCreateSchema,
	type UserListQuerySchema,
	type SuccessResponse,
	type ValidationErrorResponse,
	type PaginationMeta,
} from "@/lib/validations";
import type { User } from "@/types/database";

/**
 * ユーザー一覧取得（管理者専用）
 * GET /api/users
 */
export async function GET(request: NextRequest) {
	return withAdminAuth(async () => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = userListQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			// ベースクエリの構築
			let query = supabase
				.from("users")
				.select("*", { count: "exact" });
			
			// フィルター条件の適用
			if (validatedQuery.role) {
				query = query.eq("role", validatedQuery.role);
			}
			
			if (validatedQuery.department) {
				query = query.eq("department", validatedQuery.department);
			}
			
			// 検索条件の適用
			if (validatedQuery.search) {
				query = query.or(`name.ilike.%${validatedQuery.search}%,email.ilike.%${validatedQuery.search}%,full_name.ilike.%${validatedQuery.search}%`);
			}
			
			// ソート条件の適用
			query = query.order(validatedQuery.sort, { ascending: validatedQuery.order === "asc" });
			
			// ページネーションの適用
			const offset = (validatedQuery.page - 1) * validatedQuery.limit;
			query = query.range(offset, offset + validatedQuery.limit - 1);
			
			const { data: users, error, count } = await query;
			
			if (error) {
				console.error("ユーザー取得エラー:", error);
				return NextResponse.json(
					{ error: "ユーザー情報の取得に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			// ページネーション情報の計算
			const total = count || 0;
			const totalPages = Math.ceil(total / validatedQuery.limit);
			const meta: PaginationMeta = {
				total,
				page: validatedQuery.page,
				limit: validatedQuery.limit,
				totalPages,
				hasNext: validatedQuery.page < totalPages,
				hasPrev: validatedQuery.page > 1,
			};
			
			return NextResponse.json({
				success: true,
				data: users,
				meta,
			} as SuccessResponse<User[]>);
			
		} catch (error) {
			console.error("ユーザー一覧取得エラー:", error);
			
			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{
						error: "入力値が正しくありません",
						details: error.flatten().fieldErrors,
					} as ValidationErrorResponse,
					{ status: 400 }
				);
			}
			
			return NextResponse.json(
				{ error: "内部サーバーエラー" } as ValidationErrorResponse,
				{ status: 500 }
			);
		}
	});
}

/**
 * 新規ユーザー作成（管理者専用）
 * POST /api/users
 */
export async function POST(request: NextRequest) {
	return withAdminAuth(async (session) => {
		try {
			const body = await request.json();
			
			// リクエストボディのバリデーション
			const validatedData: UserCreateSchema = userCreateSchema.parse(body);
			
			const supabase = await createServerSupabaseClient();
			
			// メールアドレスの重複チェック
			const { data: existingUser } = await supabase
				.from("users")
				.select("id")
				.eq("email", validatedData.email)
				.single();
			
			if (existingUser) {
				return NextResponse.json(
					{ error: "このメールアドレスは既に使用されています" } as ValidationErrorResponse,
					{ status: 409 }
				);
			}
			
			// パスワードのハッシュ化
			const saltRounds = 12;
			const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
			
			// ユーザーデータの準備
			const userData = {
				email: validatedData.email,
				name: validatedData.name,
				full_name: validatedData.full_name,
				department: validatedData.department,
				position: validatedData.position,
				role: validatedData.role,
				hire_date: validatedData.hire_date,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			
			// ユーザーの作成
			const { data: newUser, error } = await supabase
				.from("users")
				.insert(userData)
				.select()
				.single();
			
			if (error) {
				console.error("ユーザー作成エラー:", error);
				return NextResponse.json(
					{ error: "ユーザーの作成に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			// パスワードを含めない形でレスポンスを返す
			const responseUser = { ...newUser };
			
			return NextResponse.json({
				success: true,
				data: responseUser,
			} as SuccessResponse<User>, { status: 201 });
			
		} catch (error) {
			console.error("ユーザー作成エラー:", error);
			
			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{
						error: "入力値が正しくありません",
						details: error.flatten().fieldErrors,
					} as ValidationErrorResponse,
					{ status: 400 }
				);
			}
			
			return NextResponse.json(
				{ error: "内部サーバーエラー" } as ValidationErrorResponse,
				{ status: 500 }
			);
		}
	});
}