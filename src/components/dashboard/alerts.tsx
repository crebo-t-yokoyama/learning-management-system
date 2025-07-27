"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
	AlertTriangle,
	Clock,
	TrendingDown,
	UserX,
	CheckCircle,
	ArrowRight,
} from "lucide-react";

interface AlertsProps {
	alerts: {
		longInactiveUsers: number;
		delayedLearners: number;
		lowProgressEnrollments: number;
	};
	loading?: boolean;
}

export function Alerts({ alerts, loading = false }: AlertsProps) {
	if (loading) {
		return <AlertsSkeleton />;
	}

	const alertsData = [
		{
			id: "inactive-users",
			type: "warning" as const,
			icon: UserX,
			title: "長期間未ログインユーザー",
			count: alerts.longInactiveUsers,
			description: "30日以上ログインしていない受講者",
			color: "text-orange-600",
			bgColor: "bg-orange-50",
			borderColor: "border-orange-200",
			action: "ユーザー管理画面へ",
		},
		{
			id: "delayed-learners",
			type: "error" as const,
			icon: Clock,
			title: "進捗遅れのユーザー",
			count: alerts.delayedLearners,
			description: "期限を過ぎても未完了の受講者",
			color: "text-red-600",
			bgColor: "bg-red-50",
			borderColor: "border-red-200",
			action: "進捗確認",
		},
		{
			id: "low-progress",
			type: "warning" as const,
			icon: TrendingDown,
			title: "低進捗率の受講登録",
			count: alerts.lowProgressEnrollments,
			description: "進捗率50%未満で停滞中",
			color: "text-amber-600",
			bgColor: "bg-amber-50",
			borderColor: "border-amber-200",
			action: "受講状況確認",
		},
	];

	const totalAlerts = alertsData.reduce((sum, alert) => sum + alert.count, 0);

	const getSeverityLevel = (): "low" | "medium" | "high" => {
		if (alerts.delayedLearners > 10 || alerts.longInactiveUsers > 20) return "high";
		if (alerts.delayedLearners > 5 || alerts.longInactiveUsers > 10) return "medium";
		return "low";
	};

	const getSeverityColor = (level: "low" | "medium" | "high") => {
		switch (level) {
			case "high":
				return "text-red-600 bg-red-50 border-red-200";
			case "medium":
				return "text-orange-600 bg-orange-50 border-orange-200";
			case "low":
				return "text-green-600 bg-green-50 border-green-200";
		}
	};

	const severityLevel = getSeverityLevel();

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					<AlertTriangle className="h-5 w-5 text-slate-600" />
					<CardTitle className="text-lg font-semibold">アラート情報</CardTitle>
				</div>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className={`text-xs ${getSeverityColor(severityLevel)}`}
					>
						{totalAlerts > 0
							? `${totalAlerts}件の問題`
							: "問題なし"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{totalAlerts === 0 ? (
					<EmptyState
						icon={CheckCircle}
						title="問題はありません"
						description="現在、注意が必要な項目はありません。システムは正常に稼働しています。"
						className="text-green-600"
					/>
				) : (
					<div className="space-y-4">
						{/* 重要度サマリー */}
						{severityLevel !== "low" && (
							<Alert className={getSeverityColor(severityLevel)}>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									{severityLevel === "high" && (
										<span className="font-medium">
											緊急対応が必要です。進捗遅れや長期未ログインのユーザーが増加しています。
										</span>
									)}
									{severityLevel === "medium" && (
										<span className="font-medium">
											注意が必要です。いくつかの問題が発生しています。
										</span>
									)}
								</AlertDescription>
							</Alert>
						)}

						{/* アラート一覧 */}
						<div className="space-y-3">
							{alertsData
								.filter((alert) => alert.count > 0)
								.map((alert) => (
									<div
										key={alert.id}
										className={`p-4 rounded-lg border ${alert.borderColor} ${alert.bgColor} transition-all duration-200 hover:shadow-sm`}
									>
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3">
												<div className={`p-2 rounded-md ${alert.bgColor}`}>
													<alert.icon className={`h-4 w-4 ${alert.color}`} />
												</div>
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<h3 className={`font-medium ${alert.color}`}>
															{alert.title}
														</h3>
														<Badge
															variant={alert.type === "error" ? "destructive" : "secondary"}
															className="text-xs"
														>
															{alert.count}件
														</Badge>
													</div>
													<p className="text-sm text-slate-600">
														{alert.description}
													</p>
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												className={`${alert.color} hover:${alert.bgColor} text-xs`}
											>
												{alert.action}
												<ArrowRight className="h-3 w-3 ml-1" />
											</Button>
										</div>
									</div>
								))}
						</div>

						{/* アクションサマリー */}
						<div className="mt-4 p-3 bg-slate-50 rounded-md">
							<h4 className="text-sm font-medium text-slate-700 mb-2">
								推奨アクション
							</h4>
							<ul className="text-sm text-slate-600 space-y-1">
								{alerts.longInactiveUsers > 0 && (
									<li className="flex items-center gap-2">
										<div className="w-1 h-1 bg-slate-400 rounded-full" />
										長期未ログインユーザーへのリマインダー送信を検討
									</li>
								)}
								{alerts.delayedLearners > 0 && (
									<li className="flex items-center gap-2">
										<div className="w-1 h-1 bg-slate-400 rounded-full" />
										進捗遅れユーザーへの個別フォローアップ
									</li>
								)}
								{alerts.lowProgressEnrollments > 0 && (
									<li className="flex items-center gap-2">
										<div className="w-1 h-1 bg-slate-400 rounded-full" />
										低進捗受講者の学習環境・内容の見直し
									</li>
								)}
							</ul>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function AlertsSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					<div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
				</div>
				<div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={index}
							className="p-4 rounded-lg border border-slate-200"
						>
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 bg-slate-200 rounded animate-pulse" />
									<div className="space-y-2">
										<div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
										<div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
									</div>
								</div>
								<div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}