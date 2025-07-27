import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { withAuth, isAdmin } from "@/lib/auth-helpers";
import {
	reportQuerySchema,
	type ReportQuerySchema,
	type SuccessResponse,
	type ValidationErrorResponse,
} from "@/lib/validations";

interface LearningSummaryReport {
	generatedAt: string;
	reportPeriod: {
		dateFrom: string;
		dateTo: string;
	};
	summary: {
		totalLearners: number;
		totalCourses: number;
		totalEnrollments: number;
		completedEnrollments: number;
		totalLearningMinutes: number;
		averageProgressPercentage: number;
	};
	departmentBreakdown: Array<{
		department: string;
		learnerCount: number;
		enrollmentCount: number;
		completedEnrollments: number;
		totalLearningMinutes: number;
		averageProgressPercentage: number;
	}>;
	courseBreakdown: Array<{
		courseId: string;
		courseTitle: string;
		category: string;
		difficultyLevel: string;
		totalLearners: number;
		completedLearners: number;
		averageProgressPercentage: number;
		totalLearningMinutes: number;
	}>;
	learnerDetails?: Array<{
		learnerId: string;
		learnerName: string;
		learnerEmail: string;
		department: string;
		enrollmentCount: number;
		completedEnrollments: number;
		totalLearningMinutes: number;
		averageProgressPercentage: number;
		lastLearningDate: string | null;
	}>;
}

/**
 * 学習サマリーレポート取得
 * 管理者：全体レポート
 * 受講者：個人レポート
 * GET /api/reports/learning-summary
 */
export async function GET(request: NextRequest) {
	return withAuth(async (session) => {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject = Object.fromEntries(searchParams.entries());
			
			// クエリパラメータのバリデーション
			const validatedQuery = reportQuerySchema.parse(queryObject);
			
			const supabase = await createServerSupabaseClient();
			
			// 日付範囲の設定
			const today = new Date();
			const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			const dateFrom = validatedQuery.date_from || firstDayOfMonth.toISOString().split('T')[0];
			const dateTo = validatedQuery.date_to || today.toISOString().split('T')[0];
			
			let report: LearningSummaryReport;
			
			if (isAdmin(session)) {
				// 管理者向け全体レポート
				report = await generateAdminReport(supabase, validatedQuery, dateFrom, dateTo);
			} else {
				// 受講者向け個人レポート
				report = await generateLearnerReport(supabase, session.user.id, validatedQuery, dateFrom, dateTo);
			}
			
			// CSV形式での出力要求の場合
			if (validatedQuery.format === "csv") {
				const csvContent = generateCSVContent(report);
				return new Response(csvContent, {
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition": `attachment; filename="learning-summary-${dateFrom}-to-${dateTo}.csv"`,
					},
				});
			}
			
			return NextResponse.json({
				success: true,
				data: report,
			} as SuccessResponse<LearningSummaryReport>);
			
		} catch (error) {
			console.error("学習サマリーレポート取得エラー:", error);
			
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

async function generateAdminReport(
	supabase: any,
	query: ReportQuerySchema,
	dateFrom: string,
	dateTo: string
): Promise<LearningSummaryReport> {
	// 基本統計の取得
	let enrollmentQuery = supabase
		.from("enrollments")
		.select(`
			*,
			users!enrollments_learner_id_fkey(id, name, full_name, email, department),
			courses(id, title, category, difficulty_level)
		`)
		.gte("assigned_at", dateFrom)
		.lte("assigned_at", dateTo);
	
	// フィルター条件の適用
	if (query.department) {
		enrollmentQuery = enrollmentQuery.eq("users.department", query.department);
	}
	
	if (query.category) {
		enrollmentQuery = enrollmentQuery.eq("courses.category", query.category);
	}
	
	const { data: enrollments, error: enrollmentError } = await enrollmentQuery;
	
	if (enrollmentError) {
		throw new Error(`受講割り当て取得エラー: ${enrollmentError.message}`);
	}
	
	// 学習記録の取得
	let learningRecordQuery = supabase
		.from("learning_records")
		.select("*")
		.gte("session_date", dateFrom)
		.lte("session_date", dateTo);
	
	if (query.learner_id) {
		learningRecordQuery = learningRecordQuery.eq("learner_id", query.learner_id);
	}
	
	if (query.course_id) {
		learningRecordQuery = learningRecordQuery.eq("course_id", query.course_id);
	}
	
	const { data: learningRecords } = await learningRecordQuery;
	
	// サマリー統計の計算
	const uniqueLearners = new Set(enrollments?.map((e: any) => e.learner_id)).size;
	const uniqueCourses = new Set(enrollments?.map((e: any) => e.course_id)).size;
	const completedEnrollments = enrollments?.filter((e: any) => e.status === "completed").length || 0;
	const totalLearningMinutes = learningRecords?.reduce((sum: number, record: any) => 
		sum + (record.session_duration_minutes || 0), 0) || 0;
	const averageProgress = enrollments?.length > 0 
		? enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / enrollments.length
		: 0;
	
	// 部署別統計
	const departmentMap = new Map();
	enrollments?.forEach((enrollment: any) => {
		const dept = enrollment.users?.department || "未設定";
		if (!departmentMap.has(dept)) {
			departmentMap.set(dept, {
				department: dept,
				learnerCount: new Set(),
				enrollmentCount: 0,
				completedEnrollments: 0,
				totalLearningMinutes: 0,
				progressSum: 0,
			});
		}
		
		const deptStat = departmentMap.get(dept);
		deptStat.learnerCount.add(enrollment.learner_id);
		deptStat.enrollmentCount++;
		if (enrollment.status === "completed") {
			deptStat.completedEnrollments++;
		}
		deptStat.progressSum += enrollment.progress_percentage || 0;
	});
	
	// 学習記録を部署別に集計
	const learningByDept = new Map();
	learningRecords?.forEach((record: any) => {
		const enrollment = enrollments?.find((e: any) => e.id === record.enrollment_id);
		const dept = enrollment?.users?.department || "未設定";
		learningByDept.set(dept, (learningByDept.get(dept) || 0) + (record.session_duration_minutes || 0));
	});
	
	const departmentBreakdown = Array.from(departmentMap.values()).map((dept: any) => ({
		department: dept.department,
		learnerCount: dept.learnerCount.size,
		enrollmentCount: dept.enrollmentCount,
		completedEnrollments: dept.completedEnrollments,
		totalLearningMinutes: learningByDept.get(dept.department) || 0,
		averageProgressPercentage: Math.round((dept.progressSum / dept.enrollmentCount) * 100) / 100,
	}));
	
	// コース別統計
	const courseMap = new Map();
	enrollments?.forEach((enrollment: any) => {
		const courseId = enrollment.course_id;
		if (!courseMap.has(courseId)) {
			courseMap.set(courseId, {
				courseId,
				courseTitle: enrollment.courses?.title || "不明",
				category: enrollment.courses?.category || "未分類",
				difficultyLevel: enrollment.courses?.difficulty_level || "不明",
				learners: new Set(),
				completedLearners: new Set(),
				progressSum: 0,
				enrollmentCount: 0,
			});
		}
		
		const courseStat = courseMap.get(courseId);
		courseStat.learners.add(enrollment.learner_id);
		courseStat.enrollmentCount++;
		if (enrollment.status === "completed") {
			courseStat.completedLearners.add(enrollment.learner_id);
		}
		courseStat.progressSum += enrollment.progress_percentage || 0;
	});
	
	// 学習記録をコース別に集計
	const learningByCourse = new Map();
	learningRecords?.forEach((record: any) => {
		const courseId = record.course_id;
		learningByCourse.set(courseId, (learningByCourse.get(courseId) || 0) + (record.session_duration_minutes || 0));
	});
	
	const courseBreakdown = Array.from(courseMap.values()).map((course: any) => ({
		courseId: course.courseId,
		courseTitle: course.courseTitle,
		category: course.category,
		difficultyLevel: course.difficultyLevel,
		totalLearners: course.learners.size,
		completedLearners: course.completedLearners.size,
		averageProgressPercentage: Math.round((course.progressSum / course.enrollmentCount) * 100) / 100,
		totalLearningMinutes: learningByCourse.get(course.courseId) || 0,
	}));
	
	// 受講者詳細（管理者のみ）
	const learnerMap = new Map();
	enrollments?.forEach((enrollment: any) => {
		const learnerId = enrollment.learner_id;
		if (!learnerMap.has(learnerId)) {
			learnerMap.set(learnerId, {
				learnerId,
				learnerName: enrollment.users?.full_name || enrollment.users?.name || "不明",
				learnerEmail: enrollment.users?.email || "",
				department: enrollment.users?.department || "未設定",
				enrollmentCount: 0,
				completedEnrollments: 0,
				progressSum: 0,
				lastLearningDate: null,
			});
		}
		
		const learnerStat = learnerMap.get(learnerId);
		learnerStat.enrollmentCount++;
		if (enrollment.status === "completed") {
			learnerStat.completedEnrollments++;
		}
		learnerStat.progressSum += enrollment.progress_percentage || 0;
	});
	
	// 学習記録を受講者別に集計
	const learningByLearner = new Map();
	const lastLearningByLearner = new Map();
	learningRecords?.forEach((record: any) => {
		const learnerId = record.learner_id;
		learningByLearner.set(learnerId, (learningByLearner.get(learnerId) || 0) + (record.session_duration_minutes || 0));
		
		const currentLast = lastLearningByLearner.get(learnerId);
		if (!currentLast || record.session_date > currentLast) {
			lastLearningByLearner.set(learnerId, record.session_date);
		}
	});
	
	const learnerDetails = Array.from(learnerMap.values()).map((learner: any) => ({
		learnerId: learner.learnerId,
		learnerName: learner.learnerName,
		learnerEmail: learner.learnerEmail,
		department: learner.department,
		enrollmentCount: learner.enrollmentCount,
		completedEnrollments: learner.completedEnrollments,
		totalLearningMinutes: learningByLearner.get(learner.learnerId) || 0,
		averageProgressPercentage: Math.round((learner.progressSum / learner.enrollmentCount) * 100) / 100,
		lastLearningDate: lastLearningByLearner.get(learner.learnerId) || null,
	}));
	
	return {
		generatedAt: new Date().toISOString(),
		reportPeriod: { dateFrom, dateTo },
		summary: {
			totalLearners: uniqueLearners,
			totalCourses: uniqueCourses,
			totalEnrollments: enrollments?.length || 0,
			completedEnrollments,
			totalLearningMinutes,
			averageProgressPercentage: Math.round(averageProgress * 100) / 100,
		},
		departmentBreakdown,
		courseBreakdown,
		learnerDetails,
	};
}

async function generateLearnerReport(
	supabase: any,
	learnerId: string,
	query: ReportQuerySchema,
	dateFrom: string,
	dateTo: string
): Promise<LearningSummaryReport> {
	// 受講者の受講割り当て取得
	let enrollmentQuery = supabase
		.from("enrollments")
		.select(`
			*,
			courses(id, title, category, difficulty_level)
		`)
		.eq("learner_id", learnerId)
		.gte("assigned_at", dateFrom)
		.lte("assigned_at", dateTo);
	
	if (query.course_id) {
		enrollmentQuery = enrollmentQuery.eq("course_id", query.course_id);
	}
	
	const { data: enrollments } = await enrollmentQuery;
	
	// 受講者の学習記録取得
	const { data: learningRecords } = await supabase
		.from("learning_records")
		.select("*")
		.eq("learner_id", learnerId)
		.gte("session_date", dateFrom)
		.lte("session_date", dateTo);
	
	// 受講者情報取得
	const { data: learnerInfo } = await supabase
		.from("users")
		.select("name, full_name, email, department")
		.eq("id", learnerId)
		.single();
	
	const completedEnrollments = enrollments?.filter((e: any) => e.status === "completed").length || 0;
	const totalLearningMinutes = learningRecords?.reduce((sum: number, record: any) => 
		sum + (record.session_duration_minutes || 0), 0) || 0;
	const averageProgress = enrollments?.length > 0 
		? enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / enrollments.length
		: 0;
	
	// コース別統計
	const courseBreakdown = enrollments?.map((enrollment: any) => {
		const courseLearningMinutes = learningRecords?.filter((record: any) => 
			record.course_id === enrollment.course_id
		).reduce((sum: number, record: any) => sum + (record.session_duration_minutes || 0), 0) || 0;
		
		return {
			courseId: enrollment.course_id,
			courseTitle: enrollment.courses?.title || "不明",
			category: enrollment.courses?.category || "未分類",
			difficultyLevel: enrollment.courses?.difficulty_level || "不明",
			totalLearners: 1,
			completedLearners: enrollment.status === "completed" ? 1 : 0,
			averageProgressPercentage: enrollment.progress_percentage || 0,
			totalLearningMinutes: courseLearningMinutes,
		};
	}) || [];
	
	return {
		generatedAt: new Date().toISOString(),
		reportPeriod: { dateFrom, dateTo },
		summary: {
			totalLearners: 1,
			totalCourses: new Set(enrollments?.map((e: any) => e.course_id)).size,
			totalEnrollments: enrollments?.length || 0,
			completedEnrollments,
			totalLearningMinutes,
			averageProgressPercentage: Math.round(averageProgress * 100) / 100,
		},
		departmentBreakdown: [{
			department: learnerInfo?.department || "未設定",
			learnerCount: 1,
			enrollmentCount: enrollments?.length || 0,
			completedEnrollments,
			totalLearningMinutes,
			averageProgressPercentage: Math.round(averageProgress * 100) / 100,
		}],
		courseBreakdown,
	};
}

function generateCSVContent(report: LearningSummaryReport): string {
	const lines: string[] = [];
	
	// ヘッダー情報
	lines.push("学習サマリーレポート");
	lines.push(`生成日時,${report.generatedAt}`);
	lines.push(`期間,${report.reportPeriod.dateFrom} - ${report.reportPeriod.dateTo}`);
	lines.push("");
	
	// サマリー統計
	lines.push("サマリー統計");
	lines.push("項目,値");
	lines.push(`総受講者数,${report.summary.totalLearners}`);
	lines.push(`総コース数,${report.summary.totalCourses}`);
	lines.push(`総受講割り当て数,${report.summary.totalEnrollments}`);
	lines.push(`完了数,${report.summary.completedEnrollments}`);
	lines.push(`総学習時間（分）,${report.summary.totalLearningMinutes}`);
	lines.push(`平均進捗率,${report.summary.averageProgressPercentage}%`);
	lines.push("");
	
	// 部署別統計
	lines.push("部署別統計");
	lines.push("部署,受講者数,受講割り当て数,完了数,学習時間（分）,平均進捗率");
	for (const dept of report.departmentBreakdown) {
		lines.push(`${dept.department},${dept.learnerCount},${dept.enrollmentCount},${dept.completedEnrollments},${dept.totalLearningMinutes},${dept.averageProgressPercentage}%`);
	}
	lines.push("");
	
	// コース別統計
	lines.push("コース別統計");
	lines.push("コース名,カテゴリ,難易度,受講者数,完了者数,平均進捗率,学習時間（分）");
	for (const course of report.courseBreakdown) {
		lines.push(`${course.courseTitle},${course.category},${course.difficultyLevel},${course.totalLearners},${course.completedLearners},${course.averageProgressPercentage}%,${course.totalLearningMinutes}`);
	}
	
	// 受講者詳細（管理者のみ）
	if (report.learnerDetails) {
		lines.push("");
		lines.push("受講者詳細");
		lines.push("受講者名,メールアドレス,部署,受講数,完了数,学習時間（分）,平均進捗率,最終学習日");
		for (const learner of report.learnerDetails) {
			lines.push(`${learner.learnerName},${learner.learnerEmail},${learner.department},${learner.enrollmentCount},${learner.completedEnrollments},${learner.totalLearningMinutes},${learner.averageProgressPercentage}%,${learner.lastLearningDate || "なし"}`);
		}
	}
	
	return lines.join("\n");
}