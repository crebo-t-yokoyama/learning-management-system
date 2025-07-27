import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin } from "@/lib/auth-helpers";
import {
	learningRecordCreateSchema,
	learningRecordListQuerySchema,
	type LearningRecordCreateSchema,
	type LearningRecordListQuerySchema,
	type SuccessResponse,
	type ValidationErrorResponse,
	type PaginationMeta,
} from "@/lib/validations";
import type { LearningRecord } from "@/types/database";

/**
 * 学習記録一覧取得
 * 管理者：全学習記録取得
 * 受講者：自分の学習記録のみ取得
 * GET /api/learning-records
 */
export async function GET(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = learningRecordListQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			let query = supabase
				.from("learning_records")
				.select(`
					*,
					courses(id, title, category, difficulty_level),
					users!learning_records_learner_id_fkey(id, name, full_name, email, department),
					enrollments(id, status, progress_percentage)
				`, { count: "exact" });
			
			// 管理者でない場合は、自分の学習記録のみ取得
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
			
			if (validatedQuery.enrollment_id) {
				query = query.eq("enrollment_id", validatedQuery.enrollment_id);
			}
			
			// 日付範囲フィルター
			if (validatedQuery.date_from) {
				query = query.gte("session_date", validatedQuery.date_from);
			}
			
			if (validatedQuery.date_to) {
				query = query.lte("session_date", validatedQuery.date_to);
			}
			
			// ソート条件の適用
			query = query.order(validatedQuery.sort, { ascending: validatedQuery.order === "asc" });
			
			// ページネーションの適用
			const offset = (validatedQuery.page - 1) * validatedQuery.limit;
			query = query.range(offset, offset + validatedQuery.limit - 1);
			
			const { data: learningRecords, error, count } = await query;
			
			if (error) {
				console.error("学習記録取得エラー:", error);
				return NextResponse.json(
					{ error: "学習記録の取得に失敗しました" } as ValidationErrorResponse,
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
				data: learningRecords,
				meta,
			} as SuccessResponse<LearningRecord[]>);
			
		} catch (error) {
			console.error("学習記録一覧取得エラー:", error);
			
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
 * 新規学習記録作成
 * 管理者：全受講者の学習記録作成可能
 * 受講者：自分の学習記録のみ作成可能
 * POST /api/learning-records
 */
export async function POST(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			const body = await request.json();
			
			// リクエストボディのバリデーション
			const validatedData: LearningRecordCreateSchema = learningRecordCreateSchema.parse(body);
			
			// 管理者でない場合は、自分の学習記録のみ作成可能
			if (!isAdmin(session) && validatedData.learner_id !== session.user.id) {
				return NextResponse.json(
					{ error: "他の受講者の学習記録を作成することはできません" } as ValidationErrorResponse,
					{ status: 403 }
				);
			}
			
			const supabase = await createServerSupabaseClient();
			
			// 受講割り当ての存在確認
			const { data: enrollment } = await supabase
				.from("enrollments")
				.select("id, learner_id, course_id, status")
				.eq("id", validatedData.enrollment_id)
				.eq("learner_id", validatedData.learner_id)
				.eq("course_id", validatedData.course_id)
				.single();
			
			if (!enrollment) {
				return NextResponse.json(
					{ error: "指定された受講割り当てが見つかりません" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			if (enrollment.status === "cancelled") {
				return NextResponse.json(
					{ error: "キャンセルされた受講割り当てには学習記録を作成できません" } as ValidationErrorResponse,
					{ status: 400 }
				);
			}
			
			// コースの存在確認
			const { data: course } = await supabase
				.from("courses")
				.select("id, is_active")
				.eq("id", validatedData.course_id)
				.single();
			
			if (!course || !course.is_active) {
				return NextResponse.json(
					{ error: "指定されたコースが見つからないか無効です" } as ValidationErrorResponse,
					{ status: 404 }
				);
			}
			
			// セッション時間の計算
			let sessionDurationMinutes = validatedData.session_duration_minutes;
			if (!sessionDurationMinutes && validatedData.session_end_time) {
				const startTime = new Date(validatedData.session_start_time);
				const endTime = new Date(validatedData.session_end_time);
				sessionDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
			}
			
			// 累積学習時間の計算
			const { data: existingRecords } = await supabase
				.from("learning_records")
				.select("session_duration_minutes")
				.eq("enrollment_id", validatedData.enrollment_id)
				.not("session_duration_minutes", "is", null);
			
			const totalExistingMinutes = existingRecords?.reduce(
				(sum, record) => sum + (record.session_duration_minutes || 0), 
				0
			) || 0;
			
			const cumulativeLearningMinutes = totalExistingMinutes + (sessionDurationMinutes || 0);
			
			// 学習記録データの準備
			const learningRecordData = {
				enrollment_id: validatedData.enrollment_id,
				course_id: validatedData.course_id,
				learner_id: validatedData.learner_id,
				session_start_time: validatedData.session_start_time,
				session_end_time: validatedData.session_end_time,
				session_duration_minutes: sessionDurationMinutes,
				session_date: new Date(validatedData.session_start_time).toISOString().split('T')[0],
				progress_percentage: validatedData.progress_percentage,
				understanding_level: validatedData.understanding_level,
				learning_memo: validatedData.learning_memo,
				cumulative_learning_minutes: cumulativeLearningMinutes,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			
			// 学習記録の作成
			const { data: newLearningRecord, error } = await supabase
				.from("learning_records")
				.insert(learningRecordData)
				.select(`
					*,
					courses(id, title, category, difficulty_level),
					users!learning_records_learner_id_fkey(id, name, full_name, email, department),
					enrollments(id, status, progress_percentage)
				`)
				.single();
			
			if (error) {
				console.error("学習記録作成エラー:", error);
				return NextResponse.json(
					{ error: "学習記録の作成に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			// 受講割り当ての進捗状況を更新
			if (validatedData.progress_percentage !== undefined) {
				const updateData: Record<string, unknown> = {
					progress_percentage: validatedData.progress_percentage,
					updated_at: new Date().toISOString(),
				};
				
				// 初回学習の場合、開始日を設定
				if (enrollment.status === "assigned") {
					updateData.status = "in_progress";
					updateData.started_at = new Date().toISOString();
				}
				
				// 100%完了の場合、完了日を設定
				if (validatedData.progress_percentage === 100) {
					updateData.status = "completed";
					updateData.completed_at = new Date().toISOString();
				}
				
				await supabase
					.from("enrollments")
					.update(updateData)
					.eq("id", validatedData.enrollment_id);
			}
			
			return NextResponse.json({
				success: true,
				data: newLearningRecord,
			} as SuccessResponse<LearningRecord>, { status: 201 });
			
		} catch (error) {
			console.error("学習記録作成エラー:", error);
			
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