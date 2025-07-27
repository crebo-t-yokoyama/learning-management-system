import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAdminAuth } from "@/lib/auth-helpers";
import {
	statisticsQuerySchema,
	type StatisticsQuerySchema,
	type SuccessResponse,
	type ValidationErrorResponse,
} from "@/lib/validations";

interface UserProgressStatistics {
	learnerId: string;
	learnerName: string;
	learnerEmail: string;
	department: string;
	totalEnrollments: number;
	completedEnrollments: number;
	inProgressEnrollments: number;
	averageProgressPercentage: number;
	averageUnderstandingLevel: number;
	totalLearningMinutes: number;
	totalLearningSessions: number;
	lastLearningDate: string | null;
	courseBreakdown: Array<{
		courseId: string;
		courseTitle: string;
		category: string;
		status: string;
		progressPercentage: number;
		startedAt: string | null;
		completedAt: string | null;
	}>;
}

/**
 * ユーザー別進捗統計取得（管理者専用）
 * GET /api/statistics/user-progress
 */
export async function GET(request: NextRequest) {
	return withAdminAuth(async () => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = statisticsQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			// 学習統計ビューから基本データを取得
			let learningStatsQuery = supabase
				.from("learning_statistics")
				.select("*");
			
			// フィルター条件の適用
			if (validatedQuery.department) {
				learningStatsQuery = learningStatsQuery.eq("department", validatedQuery.department);
			}
			
			if (validatedQuery.category) {
				learningStatsQuery = learningStatsQuery.eq("category", validatedQuery.category);
			}
			
			if (validatedQuery.difficulty_level) {
				learningStatsQuery = learningStatsQuery.eq("difficulty_level", validatedQuery.difficulty_level);
			}
			
			// 日付範囲フィルター
			if (validatedQuery.date_from) {
				learningStatsQuery = learningStatsQuery.gte("assigned_at", validatedQuery.date_from);
			}
			
			if (validatedQuery.date_to) {
				learningStatsQuery = learningStatsQuery.lte("assigned_at", validatedQuery.date_to);
			}
			
			const { data: learningStats, error } = await learningStatsQuery.order("learner_id");
			
			if (error) {
				console.error("学習統計取得エラー:", error);
				return NextResponse.json(
					{ error: "学習統計の取得に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			// ユーザーごとに統計を集計
			const userStatsMap = new Map<string, UserProgressStatistics>();
			
			for (const stat of learningStats || []) {
				const learnerId = stat.learner_id;
				
				if (!userStatsMap.has(learnerId)) {
					// 新しいユーザーの統計を初期化
					userStatsMap.set(learnerId, {
						learnerId,
						learnerName: stat.full_name || "不明",
						learnerEmail: "", // 別途取得
						department: stat.department || "未設定",
						totalEnrollments: 0,
						completedEnrollments: 0,
						inProgressEnrollments: 0,
						averageProgressPercentage: 0,
						averageUnderstandingLevel: 0,
						totalLearningMinutes: 0,
						totalLearningSessions: 0,
						lastLearningDate: null,
						courseBreakdown: [],
					});
				}
				
				const userStat = userStatsMap.get(learnerId)!;
				
				// 統計を更新
				userStat.totalEnrollments++;
				
				if (stat.enrollment_status === "completed") {
					userStat.completedEnrollments++;
				} else if (stat.enrollment_status === "in_progress") {
					userStat.inProgressEnrollments++;
				}
				
				// コース詳細を追加
				userStat.courseBreakdown.push({
					courseId: stat.course_id,
					courseTitle: stat.course_title || "不明",
					category: stat.category || "未分類",
					status: stat.enrollment_status || "unknown",
					progressPercentage: stat.progress_percentage || 0,
					startedAt: stat.started_at,
					completedAt: stat.completed_at,
				});
				
				// 学習時間と回数を累積
				userStat.totalLearningMinutes += stat.total_learning_minutes || 0;
				userStat.totalLearningSessions += stat.learning_sessions || 0;
				
				// 最新の学習日を更新
				if (stat.last_learning_date && 
					(!userStat.lastLearningDate || stat.last_learning_date > userStat.lastLearningDate)) {
					userStat.lastLearningDate = stat.last_learning_date;
				}
			}
			
			// 平均値を計算
			for (const userStat of userStatsMap.values()) {
				if (userStat.courseBreakdown.length > 0) {
					const totalProgress = userStat.courseBreakdown.reduce(
						(sum, course) => sum + course.progressPercentage, 0
					);
					userStat.averageProgressPercentage = Math.round((totalProgress / userStat.courseBreakdown.length) * 100) / 100;
				}
				
				// 理解度の平均を別途計算（learning_statisticsから）
				const { data: understandingData } = await supabase
					.from("learning_statistics")
					.select("avg_understanding_level")
					.eq("learner_id", userStat.learnerId)
					.not("avg_understanding_level", "is", null);
				
				if (understandingData && understandingData.length > 0) {
					const avgUnderstanding = understandingData.reduce(
						(sum: number, item: any) => sum + (item.avg_understanding_level || 0), 0
					) / understandingData.length;
					userStat.averageUnderstandingLevel = Math.round(avgUnderstanding * 100) / 100;
				}
			}
			
			// ユーザーのメールアドレスを取得
			const userIds = Array.from(userStatsMap.keys());
			if (userIds.length > 0) {
				const { data: users } = await supabase
					.from("users")
					.select("id, email")
					.in("id", userIds);
				
				for (const user of users || []) {
					const userStat = userStatsMap.get(user.id);
					if (userStat) {
						userStat.learnerEmail = user.email;
					}
				}
			}
			
			const statistics = Array.from(userStatsMap.values()).sort((a, b) => 
				b.averageProgressPercentage - a.averageProgressPercentage
			);
			
			return NextResponse.json({
				success: true,
				data: statistics,
			} as SuccessResponse<UserProgressStatistics[]>);
			
		} catch (error) {
			console.error("ユーザー別進捗統計取得エラー:", error);
			
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