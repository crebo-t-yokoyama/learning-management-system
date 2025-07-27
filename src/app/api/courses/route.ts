import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin } from "@/lib/auth-helpers";
import {
	courseCreateSchema,
	courseListQuerySchema,
	type CourseCreateSchema,
	type CourseListQuerySchema,
	type SuccessResponse,
	type ValidationErrorResponse,
	type PaginationMeta,
} from "@/lib/validations";
import type { Course } from "@/types/database";

/**
 * コース一覧取得
 * 管理者：全コース取得
 * 受講者：割り当てられたコースのみ取得
 * GET /api/courses
 */
export async function GET(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = courseListQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			let query = supabase
				.from("courses")
				.select("*", { count: "exact" });
			
			// 管理者でない場合は、割り当てられたコースのみ取得
			if (!isAdmin(session)) {
				query = query
					.select(`
						*,
						enrollments!inner(
							id,
							learner_id,
							status
						)
					`, { count: "exact" })
					.eq("enrollments.learner_id", session.user.id);
			}
			
			// フィルター条件の適用
			if (validatedQuery.category) {
				query = query.eq("category", validatedQuery.category);
			}
			
			if (validatedQuery.difficulty_level) {
				query = query.eq("difficulty_level", validatedQuery.difficulty_level);
			}
			
			if (validatedQuery.is_active !== undefined) {
				query = query.eq("is_active", validatedQuery.is_active);
			}
			
			// 検索条件の適用
			if (validatedQuery.search) {
				query = query.or(`title.ilike.%${validatedQuery.search}%,overview.ilike.%${validatedQuery.search}%,description.ilike.%${validatedQuery.search}%`);
			}
			
			// ソート条件の適用
			query = query.order(validatedQuery.sort, { ascending: validatedQuery.order === "asc" });
			
			// ページネーションの適用
			const offset = (validatedQuery.page - 1) * validatedQuery.limit;
			query = query.range(offset, offset + validatedQuery.limit - 1);
			
			const { data: courses, error, count } = await query;
			
			if (error) {
				console.error("コース取得エラー:", error);
				return NextResponse.json(
					{ error: "コース情報の取得に失敗しました" } as ValidationErrorResponse,
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
				data: courses,
				meta,
			} as SuccessResponse<Course[]>);
			
		} catch (error) {
			console.error("コース一覧取得エラー:", error);
			
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
 * 新規コース作成（管理者専用）
 * POST /api/courses
 */
export async function POST(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			// 管理者権限チェック
			if (!isAdmin(session)) {
				return NextResponse.json(
					{ error: "管理者権限が必要です" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			const body = await request.json();
			
			// リクエストボディのバリデーション
			const validatedData: CourseCreateSchema = courseCreateSchema.parse(body);
			
			const supabase = await createServerSupabaseClient();
			
			// コースデータの準備
			const courseData = {
				title: validatedData.title,
				overview: validatedData.overview,
				description: validatedData.description,
				category: validatedData.category,
				difficulty_level: validatedData.difficulty_level,
				estimated_hours: validatedData.estimated_hours,
				is_active: validatedData.is_active,
				created_by: session.user.id,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			
			// コースの作成
			const { data: newCourse, error } = await supabase
				.from("courses")
				.insert(courseData)
				.select()
				.single();
			
			if (error) {
				console.error("コース作成エラー:", error);
				return NextResponse.json(
					{ error: "コースの作成に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: newCourse,
			} as SuccessResponse<Course>, { status: 201 });
			
		} catch (error) {
			console.error("コース作成エラー:", error);
			
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