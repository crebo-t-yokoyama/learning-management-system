import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import { MainNav } from "@/components/navigation/main-nav";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Alerts } from "@/components/dashboard/alerts";
import { CourseProgress } from "@/components/dashboard/course-progress";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { ErrorDisplay } from "@/components/ui/error-display";

interface DashboardData {
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

async function getDashboardData(): Promise<DashboardData> {
	try {
		const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
		const response = await fetch(`${baseUrl}/api/statistics/dashboard`, {
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		
		if (!result.success) {
			throw new Error(result.error || 'データの取得に失敗しました');
		}

		return result.data;
	} catch (error) {
		console.error('Dashboard data fetch error:', error);
		// デフォルトデータを返す
		return {
			overview: {
				totalLearners: 0,
				totalCourses: 0,
				totalEnrollments: 0,
				averageProgressPercentage: 0,
			},
			monthlyActivity: {
				newEnrollments: 0,
				completedEnrollments: 0,
				totalLearningMinutes: 0,
				activeLearners: 0,
			},
			alerts: {
				longInactiveUsers: 0,
				delayedLearners: 0,
				lowProgressEnrollments: 0,
			},
			recentActivity: [],
			courseProgress: [],
		};
	}
}

export default async function AdminDashboardPage() {
	try {
		// 管理者権限チェック
		await requireAdmin();
	} catch {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<MainNav />
			<div className="container mx-auto px-4 py-8">
				{/* ヘッダー */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-slate-900 mb-2">
						管理者ダッシュボード
					</h1>
					<p className="text-slate-600">
						学習進捗管理システムの全体状況を確認できます
					</p>
				</div>

				<Suspense fallback={<DashboardSkeleton />}>
					<DashboardContent />
				</Suspense>
			</div>
		</div>
	);
}

async function DashboardContent() {
	const dashboardData = await getDashboardData();

	return (
		<div className="space-y-8">
			{/* 統計カード */}
			<StatsCards
				overview={dashboardData.overview}
				monthlyActivity={dashboardData.monthlyActivity}
			/>

			{/* アラートと最近のアクティビティ */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Alerts alerts={dashboardData.alerts} />
				<ActivityFeed recentActivity={dashboardData.recentActivity} />
			</div>

			{/* コース別進捗 */}
			<CourseProgress courseProgress={dashboardData.courseProgress} />
		</div>
	);
}

function DashboardSkeleton() {
	return (
		<div className="space-y-8">
			{/* 統計カードのスケルトン */}
			<div className="space-y-6">
				{/* 全体統計 */}
				<div>
					<div className="flex items-center gap-2 mb-4">
						<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
						<div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="bg-white p-6 rounded-lg shadow">
								<div className="flex justify-between items-start mb-4">
									<div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
									<div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
								</div>
								<div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-1" />
								<div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
							</div>
						))}
					</div>
				</div>

				{/* 今月のアクティビティ */}
				<div>
					<div className="flex items-center gap-2 mb-4">
						<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
						<div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="bg-white p-6 rounded-lg shadow">
								<div className="flex justify-between items-start mb-4">
									<div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
									<div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
								</div>
								<div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-1" />
								<div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* アラートとアクティビティフィードのスケルトン */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white p-6 rounded-lg shadow h-96">
					<div className="flex items-center gap-2 mb-4">
						<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
						<div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
					</div>
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
						))}
					</div>
				</div>
				<div className="bg-white p-6 rounded-lg shadow h-96">
					<div className="flex items-center gap-2 mb-4">
						<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
						<div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
					</div>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
						))}
					</div>
				</div>
			</div>

			{/* コース進捗のスケルトン */}
			<div className="bg-white p-6 rounded-lg shadow">
				<div className="flex items-center gap-2 mb-4">
					<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
				</div>
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="h-32 bg-slate-100 rounded animate-pulse" />
					))}
				</div>
			</div>
		</div>
	);
}