import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin, canAccessLearningRecord } from "@/lib/auth-helpers";
import {
	learningRecordUpdateSchema,
	uuidSchema,
	type LearningRecordUpdateSchema,
	type SuccessResponse,
	type ValidationErrorResponse,
} from "@/lib/validations";
import type { LearningRecord } from "@/types/database";

interface RouteParams {
	params: {
		id: string;
	};
}

/**
 * 特定学習記録情報取得
 * 管理者：全学習記録取得可能
 * 受講者：自分の学習記録のみ取得可能
 * GET /api/learning-records/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// パスパラメータのバリデーション
			const learningRecordId = uuidSchema.parse(params.id);
			
			// アクセス権限チェック
			const hasAccess = await canAccessLearningRecord(learningRecordId, session);
			if (!hasAccess) {
				return NextResponse.json(
					{ error: "この学習記録にアクセスする権限がありません" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			const supabase = await createServerSupabaseClient();
			
			const { data: learningRecord, error } = await supabase
				.from("learning_records")
				.select(`
					*,
					courses(id, title, category, difficulty_level, overview),
					users!learning_records_learner_id_fkey(id, name, full_name, email, department),
					enrollments(id, status, progress_percentage, assigned_at, started_at, completed_at)
				`)
				.eq("id", learningRecordId)
				.single();
			
			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "学習記録が見つかりません" } as ValidationErrorResponse,
						{ status: 404 }
					);
				}
				
				console.error("学習記録取得エラー:", error);
				return NextResponse.json(
					{ error: "学習記録の取得に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			return NextResponse.json({
				success: true,
				data: learningRecord,
			} as SuccessResponse<LearningRecord>);
			
		} catch (error) {
			console.error("学習記録取得エラー:", error);
			
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
 * 学習記録更新（当日分のみ）
 * 管理者：全学習記録更新可能
 * 受講者：自分の当日作成分のみ更新可能
 * PUT /api/learning-records/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// パスパラメータのバリデーション
			const learningRecordId = uuidSchema.parse(params.id);
			
			const body = await request.json();
			
			// リクエストボディのバリデーション
			const validatedData: LearningRecordUpdateSchema = learningRecordUpdateSchema.parse(body);
			
			const supabase = await createServerSupabaseClient();
			
			// 学習記録の存在確認とアクセス権限チェック
			const { data: existingRecord } = await supabase
				.from("learning_records")
				.select("id, learner_id, enrollment_id, session_date, session_start_time, session_duration_minutes, created_at")
				.eq("id", learningRecordId)
				.single();
			
			if (!existingRecord) {
				return NextResponse.json(
					{ error: "学習記録が見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			// アクセス権限チェック
			if (!isAdmin(session) && existingRecord.learner_id !== session.user.id) {
				return NextResponse.json(
					{ error: "この学習記録を更新する権限がありません" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			// 当日作成分のみ更新可能（管理者は除く）
			if (!isAdmin(session)) {
				const today = new Date().toISOString().split('T')[0];
				const recordDate = new Date(existingRecord.created_at!).toISOString().split('T')[0];
				
				if (recordDate !== today) {
					return NextResponse.json(
						{ error: "当日作成された学習記録のみ更新可能です" } as ValidationErrorResponse,
						{ status: 400 }
					);
				}
			}
			
			// セッション時間の再計算
			let sessionDurationMinutes = validatedData.session_duration_minutes;
			if (validatedData.session_end_time && !sessionDurationMinutes) {
				const startTime = new Date(existingRecord.session_start_time);
				const endTime = new Date(validatedData.session_end_time);
				sessionDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
			}
			
			// 累積学習時間の再計算（学習時間が変更された場合）
			let cumulativeLearningMinutes: number | undefined;
			if (sessionDurationMinutes !== undefined && sessionDurationMinutes !== existingRecord.session_duration_minutes) {
				const { data: otherRecords } = await supabase
					.from("learning_records")
					.select("session_duration_minutes")
					.eq("enrollment_id", existingRecord.enrollment_id)
					.neq("id", learningRecordId)
					.not("session_duration_minutes", "is", null);
				
				const otherTotalMinutes = otherRecords?.reduce(
					(sum, record) => sum + (record.session_duration_minutes || 0), 
					0
				) || 0;
				
				cumulativeLearningMinutes = otherTotalMinutes + sessionDurationMinutes;
			}
			
			// 更新データの準備
			const updateData: Record<string, unknown> = {
				updated_at: new Date().toISOString(),
			};
			
			if (validatedData.session_end_time !== undefined) {
				updateData.session_end_time = validatedData.session_end_time;
			}
			
			if (sessionDurationMinutes !== undefined) {
				updateData.session_duration_minutes = sessionDurationMinutes;
			}
			
			if (cumulativeLearningMinutes !== undefined) {
				updateData.cumulative_learning_minutes = cumulativeLearningMinutes;
			}
			
			if (validatedData.progress_percentage !== undefined) {
				updateData.progress_percentage = validatedData.progress_percentage;
			}
			
			if (validatedData.understanding_level !== undefined) {
				updateData.understanding_level = validatedData.understanding_level;
			}
			
			if (validatedData.learning_memo !== undefined) {
				updateData.learning_memo = validatedData.learning_memo;
			}
			
			// 空の値を除去
			Object.keys(updateData).forEach(key => {
				if (updateData[key] === undefined) {
					delete updateData[key];
				}
			});
			
			const { data: updatedRecord, error } = await supabase
				.from("learning_records")
				.update(updateData)
				.eq("id", learningRecordId)
				.select(`
					*,
					courses(id, title, category, difficulty_level),
					users!learning_records_learner_id_fkey(id, name, full_name, email, department),
					enrollments(id, status, progress_percentage)
				`)
				.single();
			
			if (error) {
				console.error("学習記録更新エラー:", error);
				return NextResponse.json(
					{ error: "学習記録の更新に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			// 受講割り当ての進捗状況を更新
			if (validatedData.progress_percentage !== undefined) {
				const enrollmentUpdateData: Record<string, unknown> = {
					progress_percentage: validatedData.progress_percentage,
					updated_at: new Date().toISOString(),
				};
				
				// 100%完了の場合、完了日を設定
				if (validatedData.progress_percentage === 100) {
					enrollmentUpdateData.status = "completed";
					enrollmentUpdateData.completed_at = new Date().toISOString();
				}
				
				await supabase
					.from("enrollments")
					.update(enrollmentUpdateData)
					.eq("id", existingRecord.enrollment_id);
			}
			
			return NextResponse.json({
				success: true,
				data: updatedRecord,
			} as SuccessResponse<LearningRecord>);
			
		} catch (error) {
			console.error("学習記録更新エラー:", error);
			
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
 * 学習記録削除（当日分のみ）
 * 管理者：全学習記録削除可能
 * 受講者：自分の当日作成分のみ削除可能
 * DELETE /api/learning-records/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	return withAuth(async (session) => {
		try {
			// パスパラメータのバリデーション
			const learningRecordId = uuidSchema.parse(params.id);
			
			const supabase = await createServerSupabaseClient();
			
			// 学習記録の存在確認とアクセス権限チェック
			const { data: existingRecord } = await supabase
				.from("learning_records")
				.select("id, learner_id, enrollment_id, session_duration_minutes, created_at")
				.eq("id", learningRecordId)
				.single();
			
			if (!existingRecord) {
				return NextResponse.json(
					{ error: "学習記録が見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			// アクセス権限チェック
			if (!isAdmin(session) && existingRecord.learner_id !== session.user.id) {
				return NextResponse.json(
					{ error: "この学習記録を削除する権限がありません" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			// 当日作成分のみ削除可能（管理者は除く）
			if (!isAdmin(session)) {
				const today = new Date().toISOString().split('T')[0];
				const recordDate = new Date(existingRecord.created_at!).toISOString().split('T')[0];
				
				if (recordDate !== today) {
					return NextResponse.json(
						{ error: "当日作成された学習記録のみ削除可能です" } as ValidationErrorResponse,
						{ status: 400 }
					);
				}
			}
			
			// 学習記録の削除
			const { error } = await supabase
				.from("learning_records")
				.delete()
				.eq("id", learningRecordId);
			
			if (error) {
				console.error("学習記録削除エラー:", error);
				return NextResponse.json(
					{ error: "学習記録の削除に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			// 累積学習時間の再計算
			if (existingRecord.session_duration_minutes) {
				const { data: remainingRecords } = await supabase
					.from("learning_records")
					.select("session_duration_minutes")
					.eq("enrollment_id", existingRecord.enrollment_id)
					.not("session_duration_minutes", "is", null);
				
				const newCumulativeMinutes = remainingRecords?.reduce(
					(sum, record) => sum + (record.session_duration_minutes || 0), 
					0
				) || 0;
				
				// 最新の学習記録の累積時間を更新
				if (remainingRecords && remainingRecords.length > 0) {
					const { data: latestRecord } = await supabase
						.from("learning_records")
						.select("id")
						.eq("enrollment_id", existingRecord.enrollment_id)
						.order("session_start_time", { ascending: false })
						.limit(1)
						.single();
					
					if (latestRecord) {
						await supabase
							.from("learning_records")
							.update({ cumulative_learning_minutes: newCumulativeMinutes })
							.eq("id", latestRecord.id);
					}
				}
			}
			
			return NextResponse.json({
				success: true,
				data: { message: "学習記録が削除されました" },
			} as SuccessResponse<{ message: string }>);
			
		} catch (error) {
			console.error("学習記録削除エラー:", error);
			
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