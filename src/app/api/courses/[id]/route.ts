import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin, canAccessCourse } from "@/lib/auth-helpers";
import {
	courseUpdateSchema,
	uuidSchema,
	type CourseUpdateSchema,
	type SuccessResponse,
	type ValidationErrorResponse,
} from "@/lib/validations";
import type { Course } from "@/types/database";

interface RouteParams {
	params: {
		id: string;
	};
}

/**
 * 特定コース情報取得
 * 管理者：全コース取得可能
 * 受講者：割り当てられたコースのみ取得可能
 * GET /api/courses/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// パスパラメータのバリデーション
			const courseId = uuidSchema.parse(params.id);
			
			// アクセス権限チェック
			const hasAccess = await canAccessCourse(courseId, session);
			if (!hasAccess) {
				return NextResponse.json(
					{ error: "このコースにアクセスする権限がありません" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			const supabase = await createServerSupabaseClient();
			
			// 管理者の場合は詳細情報も含める
			let query = supabase
				.from("courses")
				.select("*")
				.eq("id", courseId);
			
			// 受講者の場合は受講状況も含める
			if (!isAdmin(session)) {
				query = supabase
					.from("courses")
					.select(`
						*,
						enrollments!inner(
							id,
							progress_percentage,
							status,
							assigned_at,
							started_at,
							completed_at,
							due_date
						)
					`)
					.eq("id", courseId)
					.eq("enrollments.learner_id", session.user.id);
			}
			
			const { data: course, error } = await query.single();
			
			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "コースが見つかりません" } as ValidationErrorResponse,
						{ status: 404 }
					);
				}
				
				console.error("コース取得エラー:", error);
				return NextResponse.json(
					{ error: "コース情報の取得に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: course,
			} as SuccessResponse<Course>);
			
		} catch (error) {
			console.error("コース取得エラー:", error);
			
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
 * コース情報更新（管理者専用）
 * PUT /api/courses/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// 管理者権限チェック
			if (!isAdmin(session)) {
				return NextResponse.json(
					{ error: "管理者権限が必要です" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			// パスパラメータのバリデーション
			const courseId = uuidSchema.parse(params.id);
			
			const body = await request.json();
			
			// リクエストボディのバリデーション
			const validatedData: CourseUpdateSchema = courseUpdateSchema.parse(body);
			
			const supabase = await createServerSupabaseClient();
			
			// 更新データの準備
			const updateData = {
				...validatedData,
				updated_at: new Date().toISOString(),
			};
			
			// 空の値を除去
			Object.keys(updateData).forEach(key => {
				if (updateData[key as keyof typeof updateData] === undefined) {
					delete updateData[key as keyof typeof updateData];
				}
			});
			
			const { data: updatedCourse, error } = await supabase
				.from("courses")
				.update(updateData)
				.eq("id", courseId)
				.select()
				.single();
			
			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "コースが見つかりません" } as ValidationErrorResponse,
						{ status: 404 }
					);
				}
				
				console.error("コース更新エラー:", error);
				return NextResponse.json(
					{ error: "コース情報の更新に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: updatedCourse,
			} as SuccessResponse<Course>);
			
		} catch (error) {
			console.error("コース更新エラー:", error);
			
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
 * コース削除（管理者専用）
 * DELETE /api/courses/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// 管理者権限チェック
			if (!isAdmin(session)) {
				return NextResponse.json(
					{ error: "管理者権限が必要です" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			// パスパラメータのバリデーション
			const courseId = uuidSchema.parse(params.id);
			
			const supabase = await createServerSupabaseClient();
			
			// コースの存在確認
			const { data: existingCourse } = await supabase
				.from("courses")
				.select("id, title")
				.eq("id", courseId)
				.single();
			
			if (!existingCourse) {
				return NextResponse.json(
					{ error: "コースが見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			// 関連データの確認（受講割り当てがある場合は削除を制限）
			const { data: enrollments } = await supabase
				.from("enrollments")
				.select("id")
				.eq("course_id", courseId)
				.limit(1);
			
			if (enrollments && enrollments.length > 0) {
				return NextResponse.json(
					{ error: "このコースには受講者が割り当てられているため削除できません。先に受講割り当てを削除してください。" } as ValidationErrorResponse,
					{ status: 409 }
				);
			}
			
			// 学習記録の確認
			const { data: learningRecords } = await supabase
				.from("learning_records")
				.select("id")
				.eq("course_id", courseId)
				.limit(1);
			
			if (learningRecords && learningRecords.length > 0) {
				return NextResponse.json(
					{ error: "このコースには学習記録が存在するため削除できません。先に学習記録を削除してください。" } as ValidationErrorResponse,
					{ status: 409 }
				);
			}
			
			// コースの削除
			const { error } = await supabase
				.from("courses")
				.delete()
				.eq("id", courseId);
			
			if (error) {
				console.error("コース削除エラー:", error);
				return NextResponse.json(
					{ error: "コースの削除に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: { message: "コースが削除されました" },
			} as SuccessResponse<{ message: string }>);
			
		} catch (error) {
			console.error("コース削除エラー:", error);
			
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