"use client";

import {
	BookOpen,
	Calendar,
	CheckCircle,
	Clock,
	GraduationCap,
	TrendingUp,
	UserPlus,
	Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
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
	loading?: boolean;
}

export function StatsCards({ overview, monthlyActivity, loading = false }: StatsCardsProps) {
	if (loading) {
		return <StatsCardsSkeleton />;
	}

	const formatTime = (minutes: number): string => {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		if (hours > 0) {
			return `${hours}時間${remainingMinutes}分`;
		}
		return `${remainingMinutes}分`;
	};

	const getProgressColor = (percentage: number): string => {
		if (percentage >= 80) return "text-green-600";
		if (percentage >= 60) return "text-blue-600";
		if (percentage >= 40) return "text-yellow-600";
		return "text-red-600";
	};

	const statsData = [
		{
			title: "総受講者数",
			value: overview.totalLearners.toLocaleString(),
			icon: Users,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
			description: "システム登録者",
		},
		{
			title: "総コース数",
			value: overview.totalCourses.toLocaleString(),
			icon: BookOpen,
			color: "text-green-600",
			bgColor: "bg-green-50",
			description: "提供中のコース",
		},
		{
			title: "総受講登録数",
			value: overview.totalEnrollments.toLocaleString(),
			icon: GraduationCap,
			color: "text-purple-600",
			bgColor: "bg-purple-50",
			description: "全受講登録",
		},
		{
			title: "平均進捗率",
			value: `${overview.averageProgressPercentage.toFixed(1)}%`,
			icon: TrendingUp,
			color: getProgressColor(overview.averageProgressPercentage),
			bgColor: "bg-orange-50",
			description: "全受講者平均",
		},
	];

	const monthlyStatsData = [
		{
			title: "今月の新規受講",
			value: monthlyActivity.newEnrollments.toLocaleString(),
			icon: UserPlus,
			color: "text-indigo-600",
			bgColor: "bg-indigo-50",
			description: "新規受講開始",
		},
		{
			title: "今月の完了数",
			value: monthlyActivity.completedEnrollments.toLocaleString(),
			icon: CheckCircle,
			color: "text-emerald-600",
			bgColor: "bg-emerald-50",
			description: "コース完了",
		},
		{
			title: "今月の学習時間",
			value: formatTime(monthlyActivity.totalLearningMinutes),
			icon: Clock,
			color: "text-rose-600",
			bgColor: "bg-rose-50",
			description: "累計学習時間",
		},
		{
			title: "アクティブ受講者",
			value: monthlyActivity.activeLearners.toLocaleString(),
			icon: Calendar,
			color: "text-cyan-600",
			bgColor: "bg-cyan-50",
			description: "今月学習した人数",
		},
	];

	return (
		<div className="space-y-6">
			{/* 全体統計 */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<TrendingUp className="h-5 w-5 text-slate-600" />
					<h2 className="text-lg font-semibold text-slate-900">全体統計</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{statsData.map((stat, index) => (
						<Card key={`overview-${index}-${stat.title}`} className="transition-all duration-200 hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-slate-600">
									{stat.title}
								</CardTitle>
								<div className={`p-2 rounded-md ${stat.bgColor}`}>
									<stat.icon className={`h-4 w-4 ${stat.color}`} />
								</div>
							</CardHeader>
							<CardContent>
								<div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
								<p className="text-xs text-slate-500 mt-1">{stat.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* 今月のアクティビティ */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<Calendar className="h-5 w-5 text-slate-600" />
					<h2 className="text-lg font-semibold text-slate-900">今月のアクティビティ</h2>
					<Badge variant="outline" className="ml-auto">
						{new Date().getFullYear()}年{new Date().getMonth() + 1}月
					</Badge>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{monthlyStatsData.map((stat, index) => (
						<Card key={`monthly-${index}-${stat.title}`} className="transition-all duration-200 hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-slate-600">
									{stat.title}
								</CardTitle>
								<div className={`p-2 rounded-md ${stat.bgColor}`}>
									<stat.icon className={`h-4 w-4 ${stat.color}`} />
								</div>
							</CardHeader>
							<CardContent>
								<div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
								<p className="text-xs text-slate-500 mt-1">{stat.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}

function StatsCardsSkeleton() {
	return (
		<div className="space-y-6">
			{/* 全体統計のスケルトン */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={`overview-skeleton-${i}`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
								<div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
							</CardHeader>
							<CardContent>
								<div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-1" />
								<div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* 今月のアクティビティのスケルトン */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-16 bg-slate-200 rounded animate-pulse ml-auto" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={`monthly-skeleton-${i}`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
								<div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
							</CardHeader>
							<CardContent>
								<div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-1" />
								<div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}