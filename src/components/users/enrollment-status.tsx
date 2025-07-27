"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { ErrorDisplay } from "@/components/ui/error-display";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
	BookOpen, 
	Clock, 
	Calendar,
	TrendingUp,
	CheckCircle,
	PlayCircle,
	PauseCircle,
	XCircle,
	Edit,
	Trash2,
	Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuccessResponse } from "@/lib/validations";

interface EnrollmentStatusProps {
	userId: string;
}

interface EnrollmentWithCourse {
	id: string;
	status: string;
	progress_percentage: number | null;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	due_date: string | null;
	courses: {
		id: string;
		title: string;
		category: string | null;
		difficulty_level: string | null;
		estimated_hours: number | null;
	};
}

export function EnrollmentStatus({ userId }: EnrollmentStatusProps) {
	const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithCourse | null>(null);
	const [newStatus, setNewStatus] = useState("");
	const [updating, setUpdating] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		fetchEnrollments();
	}, [userId]);

	const fetchEnrollments = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/enrollments?learner_id=${userId}&limit=100`);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: SuccessResponse<EnrollmentWithCourse[]> = await response.json();
			
			if (data.success) {
				setEnrollments(data.data);
			} else {
				throw new Error("データの取得に失敗しました");
			}
		} catch (err) {
			console.error("受講状況取得エラー:", err);
			setError(err instanceof Error ? err.message : "データの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateStatus = (enrollment: EnrollmentWithCourse) => {
		setSelectedEnrollment(enrollment);
		setNewStatus(enrollment.status);
		setUpdateDialogOpen(true);
	};

	const confirmUpdateStatus = async () => {
		if (!selectedEnrollment || !newStatus) return;

		try {
			setUpdating(true);
			
			const response = await fetch(`/api/enrollments/${selectedEnrollment.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: newStatus,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "更新に失敗しました");
			}

			toast.success("受講状況を更新しました");
			fetchEnrollments();
			setUpdateDialogOpen(false);
			setSelectedEnrollment(null);
		} catch (err) {
			console.error("受講状況更新エラー:", err);
			toast.error(err instanceof Error ? err.message : "更新に失敗しました");
		} finally {
			setUpdating(false);
		}
	};

	const handleDeleteEnrollment = (enrollment: EnrollmentWithCourse) => {
		setSelectedEnrollment(enrollment);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!selectedEnrollment) return;

		try {
			setDeleting(true);
			
			const response = await fetch(`/api/enrollments/${selectedEnrollment.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "削除に失敗しました");
			}

			toast.success("受講割り当てを削除しました");
			fetchEnrollments();
			setDeleteDialogOpen(false);
			setSelectedEnrollment(null);
		} catch (err) {
			console.error("受講割り当て削除エラー:", err);
			toast.error(err instanceof Error ? err.message : "削除に失敗しました");
		} finally {
			setDeleting(false);
		}
	};

	const getStatusBadge = (status: string) => {
		const config = {
			assigned: { variant: "secondary" as const, icon: PauseCircle, label: "割り当て済み", color: "text-blue-500" },
			in_progress: { variant: "default" as const, icon: PlayCircle, label: "受講中", color: "text-orange-500" },
			completed: { variant: "default" as const, icon: CheckCircle, label: "完了", color: "text-green-500" },
			cancelled: { variant: "destructive" as const, icon: XCircle, label: "キャンセル", color: "text-red-500" },
		};

		const statusConfig = config[status as keyof typeof config] || config.assigned;
		const Icon = statusConfig.icon;

		return (
			<Badge variant={statusConfig.variant} className="flex items-center space-x-1">
				<Icon className={cn("h-3 w-3", statusConfig.color)} />
				<span>{statusConfig.label}</span>
			</Badge>
		);
	};

	const getDifficultyBadge = (level: string | null) => {
		if (!level) return null;
		
		const config = {
			beginner: { variant: "default" as const, label: "初級" },
			intermediate: { variant: "secondary" as const, label: "中級" },
			advanced: { variant: "destructive" as const, label: "上級" },
		};

		const difficultyConfig = config[level as keyof typeof config];
		if (!difficultyConfig) return null;

		return (
			<Badge variant={difficultyConfig.variant} size="sm">
				{difficultyConfig.label}
			</Badge>
		);
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "未設定";
		return new Date(dateString).toLocaleDateString("ja-JP");
	};

	if (loading) {
		return <LoadingDisplay />;
	}

	if (error) {
		return (
			<ErrorDisplay 
				message={error}
				onRetry={fetchEnrollments}
			/>
		);
	}

	if (enrollments.length === 0) {
		return (
			<EmptyState
				icon={BookOpen}
				title="受講中のコースがありません"
				description="この受講者にはまだコースが割り当てられていません。"
				action={
					<Button asChild variant="outline">
						<Link href="/admin/courses">
							<Plus className="mr-2 h-4 w-4" />
							コースを見る
						</Link>
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{enrollments.map((enrollment) => (
				<Card key={enrollment.id} className="hover:shadow-md transition-shadow">
					<CardContent className="p-6">
						<div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
							<div className="flex-1 space-y-3">
								{/* コース情報 */}
								<div className="space-y-2">
									<div className="flex items-start justify-between">
										<h3 className="font-semibold text-lg leading-tight">
											{enrollment.courses.title}
										</h3>
										<div className="flex items-center space-x-2 ml-4">
											{getStatusBadge(enrollment.status)}
											{getDifficultyBadge(enrollment.courses.difficulty_level)}
										</div>
									</div>
									
									{enrollment.courses.category && (
										<p className="text-sm text-muted-foreground">
											カテゴリ: {enrollment.courses.category}
										</p>
									)}
								</div>

								{/* 進捗情報 */}
								{enrollment.progress_percentage !== null && (
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span>進捗</span>
											<span className="font-medium">{enrollment.progress_percentage}%</span>
										</div>
										<Progress value={enrollment.progress_percentage} className="h-2" />
									</div>
								)}

								{/* 日程情報 */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
									<div className="flex items-center space-x-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium">割り当て日</p>
											<p className="text-muted-foreground">{formatDate(enrollment.assigned_at)}</p>
										</div>
									</div>
									
									{enrollment.started_at && (
										<div className="flex items-center space-x-2">
											<PlayCircle className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="font-medium">開始日</p>
												<p className="text-muted-foreground">{formatDate(enrollment.started_at)}</p>
											</div>
										</div>
									)}
									
									{enrollment.completed_at && (
										<div className="flex items-center space-x-2">
											<CheckCircle className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="font-medium">完了日</p>
												<p className="text-muted-foreground">{formatDate(enrollment.completed_at)}</p>
											</div>
										</div>
									)}
									
									{enrollment.due_date && (
										<div className="flex items-center space-x-2">
											<Clock className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="font-medium">期限</p>
												<p className="text-muted-foreground">{formatDate(enrollment.due_date)}</p>
											</div>
										</div>
									)}
								</div>

								{/* 推定学習時間 */}
								{enrollment.courses.estimated_hours && (
									<div className="flex items-center space-x-2 text-sm">
										<TrendingUp className="h-4 w-4 text-muted-foreground" />
										<span>推定学習時間: {enrollment.courses.estimated_hours}時間</span>
									</div>
								)}
							</div>

							{/* アクションボタン */}
							<div className="flex flex-col space-y-2 md:ml-4">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleUpdateStatus(enrollment)}
								>
									<Edit className="h-4 w-4 mr-2" />
									状況更新
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleDeleteEnrollment(enrollment)}
									className="text-destructive hover:text-destructive"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									削除
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			))}

			{/* 状況更新ダイアログ */}
			<AlertDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>受講状況を更新</AlertDialogTitle>
						<AlertDialogDescription>
							{selectedEnrollment && (
								<>
									<strong>{selectedEnrollment.courses.title}</strong> の受講状況を変更します。
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Select value={newStatus} onValueChange={setNewStatus}>
							<SelectTrigger>
								<SelectValue placeholder="新しい状況を選択" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="assigned">割り当て済み</SelectItem>
								<SelectItem value="in_progress">受講中</SelectItem>
								<SelectItem value="completed">完了</SelectItem>
								<SelectItem value="cancelled">キャンセル</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmUpdateStatus}
							disabled={updating || !newStatus}
						>
							{updating ? "更新中..." : "更新"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* 削除確認ダイアログ */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>受講割り当てを削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							{selectedEnrollment && (
								<>
									<strong>{selectedEnrollment.courses.title}</strong> の受講割り当てを削除します。
									<br />
									この操作は取り消せません。関連する学習記録も削除される可能性があります。
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={deleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleting ? "削除中..." : "削除"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}