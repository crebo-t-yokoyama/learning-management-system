import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin } from "@/lib/auth-helpers";
import {
	statisticsQuerySchema,
	type StatisticsQuerySchema,
	type SuccessResponse,
	type ValidationErrorResponse,
} from "@/lib/validations";

interface CourseProgressStatistics {
	courseId: string;
	courseTitle: string;
	category: string;
	difficultyLevel: string;
	estimatedHours: number;
	totalLearners: number;
	completedLearners: number;
	inProgressLearners: number;
	averageProgressPercentage: number;
	averageUnderstandingLevel: number;
	totalLearningMinutes: number;
	totalLearningSessions: number;
	progressDistribution: {
		"0-25": number;
		"26-50": number;
		"51-75": number;
		"76-100": number;
	};
}

/**
 * コース別進捗統計取得
 * 管理者：全コースの統計
 * 受講者：割り当てられたコースの統計
 * GET /api/statistics/course-progress
 */
export async function GET(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = statisticsQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			let courseStatsQuery = supabase
				.from("course_statistics")
				.select("*");
			
			// フィルター条件の適用
			if (validatedQuery.category) {
				courseStatsQuery = courseStatsQuery.eq("category", validatedQuery.category);
			}
			
			if (validatedQuery.difficulty_level) {
				courseStatsQuery = courseStatsQuery.eq("difficulty_level", validatedQuery.difficulty_level);
			}
			
			// 管理者でない場合は、自分が割り当てられたコースのみ
			if (!isAdmin(session)) {
				const { data: userEnrollments } = await supabase
					.from("enrollments")
					.select("course_id")
					.eq("learner_id", session.user.id);
				
				const courseIds = userEnrollments?.map(e => e.course_id) || [];
				if (courseIds.length === 0) {
					return NextResponse.json({
						success: true,
						data: [],
					} as SuccessResponse<CourseProgressStatistics[]>);
				}
				
				courseStatsQuery = courseStatsQuery.in("course_id", courseIds);
			}
			
			const { data: courseStats, error } = await courseStatsQuery.order("total_learners", { ascending: false });
			
			if (error) {
				console.error("コース統計取得エラー:", error);
				return NextResponse.json(
					{ error: "コース統計の取得に失敗しました" } as ValidationErrorResponse,
					{ status: 500 }
				);
			}
			
			// 進捗分布の詳細データを取得
			const statisticsWithDistribution: CourseProgressStatistics[] = [];
			
			for (const courseStat of courseStats || []) {
				// 進捗分布を取得
				const { data: enrollments } = await supabase
					.from("enrollments")
					.select("progress_percentage")
					.eq("course_id", courseStat.course_id)
					.not("progress_percentage", "is", null);
				
				const progressDistribution = {
					"0-25": 0,
					"26-50": 0,
					"51-75": 0,
					"76-100": 0,
				};
				
				enrollments?.forEach((enrollment: any) => {
					const progress = enrollment.progress_percentage || 0;
					if (progress <= 25) progressDistribution["0-25"]++;
					else if (progress <= 50) progressDistribution["26-50"]++;
					else if (progress <= 75) progressDistribution["51-75"]++;
					else progressDistribution["76-100"]++;
				});
				
				statisticsWithDistribution.push({
					courseId: courseStat.course_id,
					courseTitle: courseStat.title || "不明",
					category: courseStat.category || "未分類",
					difficultyLevel: courseStat.difficulty_level || "不明",
					estimatedHours: courseStat.estimated_hours || 0,
					totalLearners: courseStat.total_learners || 0,
					completedLearners: courseStat.completed_learners || 0,
					inProgressLearners: courseStat.in_progress_learners || 0,
					averageProgressPercentage: Math.round((courseStat.avg_progress_percentage || 0) * 100) / 100,
					averageUnderstandingLevel: Math.round((courseStat.avg_understanding_level || 0) * 100) / 100,
					totalLearningMinutes: courseStat.avg_learning_minutes || 0,
					totalLearningSessions: courseStat.total_learning_sessions || 0,
					progressDistribution,
				});
			}
			
			return NextResponse.json({
				success: true,
				data: statisticsWithDistribution,
			} as SuccessResponse<CourseProgressStatistics[]>);
			
		} catch (error) {
			console.error("コース別進捗統計取得エラー:", error);
			
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