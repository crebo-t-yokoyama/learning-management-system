import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin } from "@/lib/auth-helpers";
import {
	enrollmentCreateSchema,
	enrollmentListQuerySchema,
	type EnrollmentCreateSchema,
	type EnrollmentListQuerySchema,
	type SuccessResponse,
	type ValidationErrorResponse,
	type PaginationMeta,
} from "@/lib/validations";
import type { Enrollment } from "@/types/database";

/**
 * 受講割り当て一覧取得
 * 管理者：全受講割り当て取得
 * 受講者：自分の受講割り当てのみ取得
 * GET /api/enrollments
 */
export async function GET(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = enrollmentListQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			let query = supabase
				.from("enrollments")
				.select(`
					*,
					courses(id, title, category, difficulty_level, estimated_hours),
					users!enrollments_learner_id_fkey(id, name, full_name, email, department)
				`, { count: "exact" });
			
			// 管理者でない場合は、自分の受講割り当てのみ取得
			if (!isAdmin(session)) {
				query = query.eq("learner_id", session.user.id);
			}
			
			// フィルター条件の適用
			if (validatedQuery.learner_id) {
				query = query.eq("learner_id", validatedQuery.learner_id);
			}
			
			if (validatedQuery.course_id) {
				query = query.eq("course_id", validatedQuery.course_id);
			}
			
			if (validatedQuery.status) {
				query = query.eq("status", validatedQuery.status);
			}
			
			if (validatedQuery.assigned_by) {
				query = query.eq("assigned_by", validatedQuery.assigned_by);
			}
			
			// ソート条件の適用
			query = query.order(validatedQuery.sort, { ascending: validatedQuery.order === "asc" });
			
			// ページネーションの適用
			const offset = (validatedQuery.page - 1) * validatedQuery.limit;
			query = query.range(offset, offset + validatedQuery.limit - 1);
			
			const { data: enrollments, error, count } = await query;
			
			if (error) {
				console.error("受講割り当て取得エラー:", error);
				return NextResponse.json(
					{ error: "受講割り当て情報の取得に失敗しました" } as ValidationErrorResponse,
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
				data: enrollments,
				meta,
			} as SuccessResponse<Enrollment[]>);
			
		} catch (error) {
			console.error("受講割り当て一覧取得エラー:", error);
			
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
 * 新規受講割り当て作成（管理者専用）
 * POST /api/enrollments
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
			const validatedData: EnrollmentCreateSchema = enrollmentCreateSchema.parse(body);
			
			const supabase = await createServerSupabaseClient();
			
			// 受講者の存在確認
			const { data: learner } = await supabase
				.from("users")
				.select("id, role")
				.eq("id", validatedData.learner_id)
				.single();
			
			if (!learner) {
				return NextResponse.json(
					{ error: "指定された受講者が見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			if (learner.role !== "learner") {
				return NextResponse.json(
					{ error: "管理者を受講者として割り当てることはできません" } as ValidationErrorResponse,
					{ status: 400 }
				);
			}
			
			// コースの存在確認
			const { data: course } = await supabase
				.from("courses")
				.select("id, is_active")
				.eq("id", validatedData.course_id)
				.single();
			
			if (!course) {
				return NextResponse.json(
					{ error: "指定されたコースが見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			if (!course.is_active) {
				return NextResponse.json(
					{ error: "無効なコースには受講者を割り当てできません" } as ValidationErrorResponse,
					{ status: 400 }
				);
			}
			
			// 重複チェック
			const { data: existingEnrollment } = await supabase
				.from("enrollments")
				.select("id")
				.eq("learner_id", validatedData.learner_id)
				.eq("course_id", validatedData.course_id)
				.single();
			
			if (existingEnrollment) {
				return NextResponse.json(
					{ error: "この受講者は既にこのコースに割り当てられています" } as ValidationErrorResponse,
					{ status: 409 }
				);
			}
			
			// 受講割り当てデータの準備
			const enrollmentData = {
				learner_id: validatedData.learner_id,
				course_id: validatedData.course_id,
				due_date: validatedData.due_date,
				status: validatedData.status,
				assigned_by: session.user.id,
				assigned_at: new Date().toISOString(),
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			
			// 受講割り当ての作成
			const { data: newEnrollment, error } = await supabase
				.from("enrollments")
				.insert(enrollmentData)
				.select(`
					*,
					courses(id, title, category, difficulty_level, estimated_hours),
					users!enrollments_learner_id_fkey(id, name, full_name, email, department)
				`)
				.single();
			
			if (error) {
				console.error("受講割り当て作成エラー:", error);
				return NextResponse.json(
					{ error: "受講割り当ての作成に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: newEnrollment,
			} as SuccessResponse<Enrollment>, { status: 201 });
			
		} catch (error) {
			console.error("受講割り当て作成エラー:", error);
			
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