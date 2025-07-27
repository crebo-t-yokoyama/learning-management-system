import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin, canAccessResource } from "@/lib/auth-helpers";
import {
	enrollmentUpdateSchema,
	uuidSchema,
	type EnrollmentUpdateSchema,
	type SuccessResponse,
	type ValidationErrorResponse,
} from "@/lib/validations";
import type { Enrollment } from "@/types/database";

interface RouteParams {
	params: {
		id: string;
	};
}

/**
 * 特定受講割り当て情報取得
 * 管理者：全受講割り当て取得可能
 * 受講者：自分の受講割り当てのみ取得可能
 * GET /api/enrollments/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// パスパラメータのバリデーション
			const enrollmentId = uuidSchema.parse(params.id);
			
			const supabase = await createServerSupabaseClient();
			
			let query = supabase
				.from("enrollments")
				.select(`
					*,
					courses(id, title, category, difficulty_level, estimated_hours, overview, description),
					users!enrollments_learner_id_fkey(id, name, full_name, email, department),
					users!enrollments_assigned_by_fkey(id, name, full_name)
				`)
				.eq("id", enrollmentId);
			
			// 管理者でない場合は、自分の受講割り当てのみ取得
			if (!isAdmin(session)) {
				query = query.eq("learner_id", session.user.id);
			}
			
			const { data: enrollment, error } = await query.single();
			
			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "受講割り当てが見つかりません" } as ValidationErrorResponse,
						{ status: 404 }
					);
				}
				
				console.error("受講割り当て取得エラー:", error);
				return NextResponse.json(
					{ error: "受講割り当て情報の取得に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: enrollment,
			} as SuccessResponse<Enrollment>);
			
		} catch (error) {
			console.error("受講割り当て取得エラー:", error);
			
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
 * 受講割り当て情報更新
 * 管理者：全項目更新可能
 * 受講者：進捗率、ステータス、開始日、完了日のみ更新可能（自分の受講割り当てのみ）
 * PUT /api/enrollments/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// パスパラメータのバリデーション
			const enrollmentId = uuidSchema.parse(params.id);
			
			const body = await request.json();
			
			// リクエストボディのバリデーション
			const validatedData: EnrollmentUpdateSchema = enrollmentUpdateSchema.parse(body);
			
			const supabase = await createServerSupabaseClient();
			
			// 受講割り当ての存在確認とアクセス権限チェック
			const { data: existingEnrollment } = await supabase
				.from("enrollments")
				.select("id, learner_id, status, progress_percentage")
				.eq("id", enrollmentId)
				.single();
			
			if (!existingEnrollment) {
				return NextResponse.json(
					{ error: "受講割り当てが見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			// アクセス権限チェック
			if (!isAdmin(session) && existingEnrollment.learner_id !== session.user.id) {
				return NextResponse.json(
					{ error: "この受講割り当てを更新する権限がありません" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			// 更新データの準備
			const updateData: Record<string, unknown> = {
				updated_at: new Date().toISOString(),
			};
			
			// 管理者の場合は全項目更新可能
			if (isAdmin(session)) {
				if (validatedData.progress_percentage !== undefined) {
					updateData.progress_percentage = validatedData.progress_percentage;
				}
				if (validatedData.status !== undefined) {
					updateData.status = validatedData.status;
				}
				if (validatedData.due_date !== undefined) {
					updateData.due_date = validatedData.due_date;
				}
				if (validatedData.started_at !== undefined) {
					updateData.started_at = validatedData.started_at;
				}
				if (validatedData.completed_at !== undefined) {
					updateData.completed_at = validatedData.completed_at;
				}
			} else {
				// 受講者の場合は限定的な更新のみ許可
				if (validatedData.progress_percentage !== undefined) {
					updateData.progress_percentage = validatedData.progress_percentage;
				}
				
				// ステータスの更新ロジック
				if (validatedData.status !== undefined) {
					// assigned -> in_progress は許可
					if (existingEnrollment.status === "assigned" && validatedData.status === "in_progress") {
						updateData.status = validatedData.status;
						updateData.started_at = new Date().toISOString();
					}
					// in_progress -> completed は許可（進捗率100%の場合のみ）
					else if (
						existingEnrollment.status === "in_progress" && 
						validatedData.status === "completed" &&
						(validatedData.progress_percentage === 100 || existingEnrollment.progress_percentage === 100)
					) {
						updateData.status = validatedData.status;
						updateData.completed_at = new Date().toISOString();
						updateData.progress_percentage = 100;
					}
				}
				
				// 受講開始時の処理
				if (validatedData.started_at !== undefined && existingEnrollment.status === "assigned") {
					updateData.started_at = validatedData.started_at;
					updateData.status = "in_progress";
				}
				
				// 受講完了時の処理
				if (validatedData.completed_at !== undefined && validatedData.progress_percentage === 100) {
					updateData.completed_at = validatedData.completed_at;
					updateData.status = "completed";
					updateData.progress_percentage = 100;
				}
			}
			
			// 空の値を除去
			Object.keys(updateData).forEach(key => {
				if (updateData[key] === undefined) {
					delete updateData[key];
				}
			});
			
			const { data: updatedEnrollment, error } = await supabase
				.from("enrollments")
				.update(updateData)
				.eq("id", enrollmentId)
				.select(`
					*,
					courses(id, title, category, difficulty_level, estimated_hours),
					users!enrollments_learner_id_fkey(id, name, full_name, email, department)
				`)
				.single();
			
			if (error) {
				console.error("受講割り当て更新エラー:", error);
				return NextResponse.json(
					{ error: "受講割り当て情報の更新に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: updatedEnrollment,
			} as SuccessResponse<Enrollment>);
			
		} catch (error) {
			console.error("受講割り当て更新エラー:", error);
			
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
 * 受講割り当て削除（管理者専用）
 * DELETE /api/enrollments/[id]
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
			const enrollmentId = uuidSchema.parse(params.id);
			
			const supabase = await createServerSupabaseClient();
			
			// 受講割り当ての存在確認
			const { data: existingEnrollment } = await supabase
				.from("enrollments")
				.select("id, learner_id, course_id, status")
				.eq("id", enrollmentId)
				.single();
			
			if (!existingEnrollment) {
				return NextResponse.json(
					{ error: "受講割り当てが見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			// 関連する学習記録の確認
			const { data: learningRecords } = await supabase
				.from("learning_records")
				.select("id")
				.eq("enrollment_id", enrollmentId)
				.limit(1);
			
			if (learningRecords && learningRecords.length > 0) {
				return NextResponse.json(
					{ error: "この受講割り当てには学習記録が存在するため削除できません。先に学習記録を削除してください。" } as ValidationErrorResponse,
					{ status: 409 }
				);
			}
			
			// 受講割り当ての削除
			const { error } = await supabase
				.from("enrollments")
				.delete()
				.eq("id", enrollmentId);
			
			if (error) {
				console.error("受講割り当て削除エラー:", error);
				return NextResponse.json(
					{ error: "受講割り当ての削除に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: { message: "受講割り当てが削除されました" },
			} as SuccessResponse<{ message: string }>);
			
		} catch (error) {
			console.error("受講割り当て削除エラー:", error);
			
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