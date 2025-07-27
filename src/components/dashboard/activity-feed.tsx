"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import {
	Activity,
	BookOpen,
	Clock,
	TrendingUp,
	User,
} from "lucide-react";

interface ActivityItem {
	learner_name: string;
	course_title: string;
	session_date: string;
	session_duration_minutes: number;
	progress_percentage: number;
}

interface ActivityFeedProps {
	recentActivity: ActivityItem[];
	loading?: boolean;
}

export function ActivityFeed({ recentActivity, loading = false }: ActivityFeedProps) {
	if (loading) {
		return <ActivityFeedSkeleton />;
	}

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 1) {
			return "今日";
		} else if (diffDays === 2) {
			return "昨日";
		} else if (diffDays <= 7) {
			return `${diffDays - 1}日前`;
		} else {
			return date.toLocaleDateString("ja-JP", {
				month: "short",
				day: "numeric",
			});
		}
	};

	const formatDuration = (minutes: number): string => {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		if (hours > 0) {
			return `${hours}時間${remainingMinutes}分`;
		}
		return `${remainingMinutes}分`;
	};

	const getProgressColor = (percentage: number): string => {
		if (percentage >= 80) return "bg-green-500";
		if (percentage >= 60) return "bg-blue-500";
		if (percentage >= 40) return "bg-yellow-500";
		return "bg-red-500";
	};

	const getProgressBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
		if (percentage >= 80) return "default";
		if (percentage >= 60) return "secondary";
		if (percentage >= 40) return "outline";
		return "destructive";
	};

	return (
		<Card className="h-[400px]">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					<Activity className="h-5 w-5 text-slate-600" />
					<CardTitle className="text-lg font-semibold">最近の学習活動</CardTitle>
				</div>
				<Badge variant="outline" className="text-xs">
					直近10件
				</Badge>
			</CardHeader>
			<CardContent className="px-0">
				{recentActivity.length === 0 ? (
					<div className="px-6">
						<EmptyState
							icon={Activity}
							title="学習活動がありません"
							description="まだ学習記録がありません。受講者が学習を開始すると、ここに活動が表示されます。"
						/>
					</div>
				) : (
					<ScrollArea className="h-[280px] px-6">
						<div className="space-y-4">
							{recentActivity.map((activity, index) => (
								<div
									key={`${activity.learner_name}-${activity.course_title}-${index}`}
									className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
								>
									<div className="flex-shrink-0">
										<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
											<User className="h-4 w-4 text-blue-600" />
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<p className="text-sm font-medium text-slate-900 truncate">
												{activity.learner_name}
											</p>
											<time className="text-xs text-slate-500 flex-shrink-0">
												{formatDate(activity.session_date)}
											</time>
										</div>
										<div className="flex items-center gap-2 mb-2">
											<BookOpen className="h-3 w-3 text-slate-400" />
											<p className="text-sm text-slate-600 truncate">
												{activity.course_title}
											</p>
										</div>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="flex items-center gap-1">
													<Clock className="h-3 w-3 text-slate-400" />
													<span className="text-xs text-slate-500">
														{formatDuration(activity.session_duration_minutes)}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<TrendingUp className="h-3 w-3 text-slate-400" />
													<Badge
														variant={getProgressBadgeVariant(activity.progress_percentage)}
														className="text-xs px-1.5 py-0.5"
													>
														{activity.progress_percentage.toFixed(0)}%
													</Badge>
												</div>
											</div>
											{/* プログレスインジケーター */}
											<div className="flex-shrink-0 w-16">
												<div className="w-full bg-slate-200 rounded-full h-1.5">
													<div
														className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(
															activity.progress_percentage
														)}`}
														style={{
															width: `${Math.min(activity.progress_percentage, 100)}%`,
														}}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}

function ActivityFeedSkeleton() {
	return (
		<Card className="h-[400px]">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
				</div>
				<div className="h-5 w-12 bg-slate-200 rounded animate-pulse" />
			</CardHeader>
			<CardContent className="px-6">
				<div className="space-y-4">
					{Array.from({ length: 5 }).map((_, index) => (
						<div
							key={index}
							className="flex items-start space-x-3 p-3 rounded-lg border"
						>
							<div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
							<div className="flex-1 space-y-2">
								<div className="flex items-center justify-between">
									<div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
									<div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
								</div>
								<div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
								<div className="flex items-center justify-between">
									<div className="flex gap-3">
										<div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
										<div className="h-4 w-10 bg-slate-200 rounded animate-pulse" />
									</div>
									<div className="h-1.5 w-16 bg-slate-200 rounded animate-pulse" />
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}