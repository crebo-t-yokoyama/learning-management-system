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

interface DashboardStatistics {
	overview: {
		totalLearners: number;
		totalCourses: number;
		totalEnrollments: number;
		averageProgressPercentage: number;
	};
	monthlyActivity: {
		newEnrollments: number;
		completedEnrollments: number;
		totalLearningMinutes: number;
		activeLearners: number;
	};
	alerts: {
		longInactiveUsers: number;
		delayedLearners: number;
		lowProgressEnrollments: number;
	};
	recentActivity: Array<{
		learner_name: string;
		course_title: string;
		session_date: string;
		session_duration_minutes: number;
		progress_percentage: number;
	}>;
	courseProgress: Array<{
		course_id: string;
		course_title: string;
		category: string;
		total_learners: number;
		completed_learners: number;
		avg_progress_percentage: number;
		avg_understanding_level: number;
	}>;
}

/**
 * ダッシュボード統計取得
 * 管理者：全体統計
 * 受講者：個人統計
 * GET /api/statistics/dashboard
 */
export async function GET(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = statisticsQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			if (isAdmin(session)) {
				// 管理者向けダッシュボード統計
				const statistics = await getAdminDashboardStatistics(supabase, validatedQuery);
				
				return NextResponse.json({
					success: true,
					data: statistics,
				} as SuccessResponse<DashboardStatistics>);
			} else {
				// 受講者向け個人統計
				const statistics = await getLearnerDashboardStatistics(supabase, session.user.id, validatedQuery);
				
				return NextResponse.json({
					success: true,
					data: statistics,
				} as SuccessResponse<Partial<DashboardStatistics>>);
			}
			
		} catch (error) {
			console.error("ダッシュボード統計取得エラー:", error);
			
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

async function getAdminDashboardStatistics(
	supabase: any,
	query: StatisticsQuerySchema
): Promise<DashboardStatistics> {
	// 日付範囲の設定
	const today = new Date();
	const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	const dateFrom = query.date_from || firstDayOfMonth.toISOString().split('T')[0];
	const dateTo = query.date_to || today.toISOString().split('T')[0];
	
	// 1. 全体概要統計
	const [
		{ count: totalLearners },
		{ count: totalCourses },
		{ count: totalEnrollments },
		{ data: avgProgressData }
	] = await Promise.all([
		supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "learner"),
		supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
		supabase.from("enrollments").select("*", { count: "exact", head: true }),
		supabase.from("enrollments").select("progress_percentage").not("progress_percentage", "is", null)
	]);
	
	const averageProgressPercentage = avgProgressData?.length > 0
		? avgProgressData.reduce((sum: number, item: any) => sum + item.progress_percentage, 0) / avgProgressData.length
		: 0;
	
	// 2. 月間アクティビティ
	const [
		{ count: newEnrollments },
		{ count: completedEnrollments },
		{ data: learningRecords },
		{ data: activeLearnerData }
	] = await Promise.all([
		supabase
			.from("enrollments")
			.select("*", { count: "exact", head: true })
			.gte("assigned_at", dateFrom)
			.lte("assigned_at", dateTo),
		supabase
			.from("enrollments")
			.select("*", { count: "exact", head: true })
			.eq("status", "completed")
			.gte("completed_at", dateFrom)
			.lte("completed_at", dateTo),
		supabase
			.from("learning_records")
			.select("session_duration_minutes")
			.gte("session_date", dateFrom)
			.lte("session_date", dateTo)
			.not("session_duration_minutes", "is", null),
		supabase
			.from("learning_records")
			.select("learner_id")
			.gte("session_date", dateFrom)
			.lte("session_date", dateTo)
	]);
	
	const totalLearningMinutes = learningRecords?.reduce(
		(sum: number, record: any) => sum + (record.session_duration_minutes || 0), 
		0
	) || 0;
	
	const activeLearners = new Set(activeLearnerData?.map((item: any) => item.learner_id)).size;
	
	// 3. アラート情報
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(today.getDate() - 30);
	
	const [
		{ count: longInactiveUsers },
		{ count: delayedLearners },
		{ count: lowProgressEnrollments }
	] = await Promise.all([
		supabase
			.from("users")
			.select("*", { count: "exact", head: true })
			.eq("role", "learner")
			.or(`last_login_at.is.null,last_login_at.lt.${thirtyDaysAgo.toISOString()}`),
		supabase
			.from("enrollments")
			.select("*", { count: "exact", head: true })
			.eq("status", "in_progress")
			.not("due_date", "is", null)
			.lt("due_date", today.toISOString()),
		supabase
			.from("enrollments")
			.select("*", { count: "exact", head: true })
			.eq("status", "in_progress")
			.lt("progress_percentage", 50)
	]);
	
	// 4. 最近のアクティビティ
	const { data: recentActivityData } = await supabase
		.from("learning_records")
		.select(`
			session_date,
			session_duration_minutes,
			progress_percentage,
			users!learning_records_learner_id_fkey(name, full_name),
			courses(title)
		`)
		.order("session_start_time", { ascending: false })
		.limit(10);
	
	const recentActivity = recentActivityData?.map((item: any) => ({
		learner_name: item.users?.full_name || item.users?.name || "不明",
		course_title: item.courses?.title || "不明",
		session_date: item.session_date,
		session_duration_minutes: item.session_duration_minutes || 0,
		progress_percentage: item.progress_percentage || 0,
	})) || [];
	
	// 5. コース別進捗
	const { data: courseProgressData } = await supabase
		.from("course_statistics")
		.select("*")
		.order("total_learners", { ascending: false })
		.limit(10);
	
	const courseProgress = courseProgressData?.map((item: any) => ({
		course_id: item.course_id,
		course_title: item.title,
		category: item.category,
		total_learners: item.total_learners || 0,
		completed_learners: item.completed_learners || 0,
		avg_progress_percentage: item.avg_progress_percentage || 0,
		avg_understanding_level: item.avg_understanding_level || 0,
	})) || [];
	
	return {
		overview: {
			totalLearners: totalLearners || 0,
			totalCourses: totalCourses || 0,
			totalEnrollments: totalEnrollments || 0,
			averageProgressPercentage: Math.round(averageProgressPercentage * 100) / 100,
		},
		monthlyActivity: {
			newEnrollments: newEnrollments || 0,
			completedEnrollments: completedEnrollments || 0,
			totalLearningMinutes,
			activeLearners,
		},
		alerts: {
			longInactiveUsers: longInactiveUsers || 0,
			delayedLearners: delayedLearners || 0,
			lowProgressEnrollments: lowProgressEnrollments || 0,
		},
		recentActivity,
		courseProgress,
	};
}

async function getLearnerDashboardStatistics(
	supabase: any,
	learnerId: string,
	query: StatisticsQuerySchema
): Promise<Partial<DashboardStatistics>> {
	// 日付範囲の設定
	const today = new Date();
	const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	const dateFrom = query.date_from || firstDayOfMonth.toISOString().split('T')[0];
	const dateTo = query.date_to || today.toISOString().split('T')[0];
	
	// 受講者の統計情報
	const [
		{ count: totalEnrollments },
		{ count: completedEnrollments },
		{ data: avgProgressData },
		{ data: learningRecords }
	] = await Promise.all([
		supabase
			.from("enrollments")
			.select("*", { count: "exact", head: true })
			.eq("learner_id", learnerId),
		supabase
			.from("enrollments")
			.select("*", { count: "exact", head: true })
			.eq("learner_id", learnerId)
			.eq("status", "completed"),
		supabase
			.from("enrollments")
			.select("progress_percentage")
			.eq("learner_id", learnerId)
			.not("progress_percentage", "is", null),
		supabase
			.from("learning_records")
			.select("session_duration_minutes")
			.eq("learner_id", learnerId)
			.gte("session_date", dateFrom)
			.lte("session_date", dateTo)
			.not("session_duration_minutes", "is", null)
	]);
	
	const averageProgressPercentage = avgProgressData?.length > 0
		? avgProgressData.reduce((sum: number, item: any) => sum + item.progress_percentage, 0) / avgProgressData.length
		: 0;
	
	const totalLearningMinutes = learningRecords?.reduce(
		(sum: number, record: any) => sum + (record.session_duration_minutes || 0), 
		0
	) || 0;
	
	// 最近のアクティビティ（自分の学習記録）
	const { data: recentActivityData } = await supabase
		.from("learning_records")
		.select(`
			session_date,
			session_duration_minutes,
			progress_percentage,
			courses(title)
		`)
		.eq("learner_id", learnerId)
		.order("session_start_time", { ascending: false })
		.limit(10);
	
	const recentActivity = recentActivityData?.map((item: any) => ({
		learner_name: "自分",
		course_title: item.courses?.title || "不明",
		session_date: item.session_date,
		session_duration_minutes: item.session_duration_minutes || 0,
		progress_percentage: item.progress_percentage || 0,
	})) || [];
	
	return {
		overview: {
			totalLearners: 1,
			totalCourses: totalEnrollments || 0,
			totalEnrollments: totalEnrollments || 0,
			averageProgressPercentage: Math.round(averageProgressPercentage * 100) / 100,
		},
		monthlyActivity: {
			newEnrollments: 0,
			completedEnrollments: completedEnrollments || 0,
			totalLearningMinutes,
			activeLearners: 1,
		},
		recentActivity,
	};
}