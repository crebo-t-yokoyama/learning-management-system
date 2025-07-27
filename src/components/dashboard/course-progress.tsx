"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
	BookOpen,
	Users,
	TrendingUp,
	CheckCircle,
	ArrowRight,
	BarChart3,
	Star,
} from "lucide-react";

interface CourseProgressItem {
	course_id: string;
	course_title: string;
	category: string;
	total_learners: number;
	completed_learners: number;
	avg_progress_percentage: number;
	avg_understanding_level: number;
}

interface CourseProgressProps {
	courseProgress: CourseProgressItem[];
	loading?: boolean;
}

export function CourseProgress({ courseProgress, loading = false }: CourseProgressProps) {
	if (loading) {
		return <CourseProgressSkeleton />;
	}

	const getCategoryColor = (category: string): string => {
		const categoryColors: Record<string, string> = {
			技術: "bg-blue-100 text-blue-800",
			マネジメント: "bg-green-100 text-green-800",
			コンプライアンス: "bg-red-100 text-red-800",
			営業: "bg-purple-100 text-purple-800",
			その他: "bg-gray-100 text-gray-800",
		};
		return categoryColors[category] || categoryColors["その他"];
	};

	const getProgressColor = (percentage: number): string => {
		if (percentage >= 80) return "bg-green-500";
		if (percentage >= 60) return "bg-blue-500";
		if (percentage >= 40) return "bg-yellow-500";
		return "bg-red-500";
	};

	const getUnderstandingStars = (level: number): JSX.Element[] => {
		const stars = [];
		const roundedLevel = Math.round(level);
		for (let i = 1; i <= 5; i++) {
			stars.push(
				<Star
					key={i}
					className={`h-3 w-3 ${
						i <= roundedLevel
							? "text-yellow-400 fill-yellow-400"
							: "text-gray-300"
					}`}
				/>
			);
		}
		return stars;
	};

	const getCompletionRate = (completed: number, total: number): number => {
		return total > 0 ? (completed / total) * 100 : 0;
	};

	const sortedCourses = [...courseProgress].sort(
		(a, b) => b.total_learners - a.total_learners
	);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5 text-slate-600" />
					<CardTitle className="text-lg font-semibold">コース別進捗状況</CardTitle>
				</div>
				<Badge variant="outline" className="text-xs">
					上位10コース
				</Badge>
			</CardHeader>
			<CardContent>
				{courseProgress.length === 0 ? (
					<EmptyState
						icon={BookOpen}
						title="コースがありません"
						description="まだコースが作成されていません。コースを作成すると、ここに進捗状況が表示されます。"
					/>
				) : (
					<div className="space-y-4">
						{sortedCourses.map((course) => {
							const completionRate = getCompletionRate(
								course.completed_learners,
								course.total_learners
							);

							return (
								<div
									key={course.course_id}
									className="p-4 rounded-lg border hover:bg-slate-50 transition-colors"
								>
									{/* コース基本情報 */}
									<div className="flex items-start justify-between mb-3">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="font-medium text-slate-900 truncate">
													{course.course_title}
												</h3>
												<Badge
													variant="secondary"
													className={`text-xs ${getCategoryColor(course.category)}`}
												>
													{course.category}
												</Badge>
											</div>
											<div className="flex items-center gap-4 text-sm text-slate-600">
												<div className="flex items-center gap-1">
													<Users className="h-3 w-3" />
													<span>{course.total_learners}名受講中</span>
												</div>
												<div className="flex items-center gap-1">
													<CheckCircle className="h-3 w-3" />
													<span>{course.completed_learners}名完了</span>
												</div>
												<div className="flex items-center gap-1">
													<div className="flex">
														{getUnderstandingStars(course.avg_understanding_level)}
													</div>
													<span className="text-xs">
														理解度 {course.avg_understanding_level.toFixed(1)}
													</span>
												</div>
											</div>
										</div>
										<Button variant="ghost" size="sm" className="text-slate-600">
											詳細
											<ArrowRight className="h-3 w-3 ml-1" />
										</Button>
									</div>

									{/* 進捗バーとメトリクス */}
									<div className="space-y-3">
										{/* 平均進捗率 */}
										<div>
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<TrendingUp className="h-3 w-3 text-slate-400" />
													<span className="text-sm text-slate-600">平均進捗率</span>
												</div>
												<span className="text-sm font-medium text-slate-900">
													{course.avg_progress_percentage.toFixed(1)}%
												</span>
											</div>
											<Progress
												value={course.avg_progress_percentage}
												className="h-2"
											/>
										</div>

										{/* 完了率 */}
										<div>
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<CheckCircle className="h-3 w-3 text-slate-400" />
													<span className="text-sm text-slate-600">完了率</span>
												</div>
												<span className="text-sm font-medium text-slate-900">
													{completionRate.toFixed(1)}%
												</span>
											</div>
											<div className="w-full bg-slate-200 rounded-full h-2">
												<div
													className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
														completionRate
													)}`}
													style={{
														width: `${Math.min(completionRate, 100)}%`,
													}}
												/>
											</div>
										</div>

										{/* メトリクスサマリー */}
										<div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
											<div className="text-center">
												<div className="text-lg font-bold text-blue-600">
													{course.total_learners}
												</div>
												<div className="text-xs text-slate-500">受講者数</div>
											</div>
											<div className="text-center">
												<div className="text-lg font-bold text-green-600">
													{course.completed_learners}
												</div>
												<div className="text-xs text-slate-500">完了者数</div>
											</div>
											<div className="text-center">
												<div className="text-lg font-bold text-purple-600">
													{course.avg_understanding_level.toFixed(1)}
												</div>
												<div className="text-xs text-slate-500">平均理解度</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}

						{/* アクションエリア */}
						<div className="mt-4 p-3 bg-slate-50 rounded-md">
							<h4 className="text-sm font-medium text-slate-700 mb-2">
								改善提案
							</h4>
							<div className="text-sm text-slate-600 space-y-1">
								{sortedCourses.some(
									(course) => course.avg_progress_percentage < 50
								) && (
									<div className="flex items-center gap-2">
										<div className="w-1 h-1 bg-slate-400 rounded-full" />
										進捗が低いコースの内容・難易度を見直すことを推奨
									</div>
								)}
								{sortedCourses.some(
									(course) => course.avg_understanding_level < 3
								) && (
									<div className="flex items-center gap-2">
										<div className="w-1 h-1 bg-slate-400 rounded-full" />
										理解度が低いコースの教材・説明を改善することを推奨
									</div>
								)}
								{sortedCourses.some(
									(course) =>
										getCompletionRate(course.completed_learners, course.total_learners) <
										20
								) && (
									<div className="flex items-center gap-2">
										<div className="w-1 h-1 bg-slate-400 rounded-full" />
										完了率が低いコースの受講者サポートを強化することを推奨
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function CourseProgressSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
				</div>
				<div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, index) => (
						<div key={index} className="p-4 rounded-lg border">
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1 space-y-2">
									<div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
									<div className="h-3 w-64 bg-slate-200 rounded animate-pulse" />
								</div>
								<div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
							</div>
							<div className="space-y-3">
								<div>
									<div className="flex justify-between mb-2">
										<div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
										<div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
									</div>
									<div className="h-2 w-full bg-slate-200 rounded animate-pulse" />
								</div>
								<div>
									<div className="flex justify-between mb-2">
										<div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
										<div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
									</div>
									<div className="h-2 w-full bg-slate-200 rounded animate-pulse" />
								</div>
								<div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
									{Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="text-center">
											<div className="h-6 w-8 bg-slate-200 rounded animate-pulse mx-auto mb-1" />
											<div className="h-3 w-12 bg-slate-200 rounded animate-pulse mx-auto" />
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}