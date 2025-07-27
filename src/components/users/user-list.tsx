"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
	Edit, 
	Eye, 
	Trash2, 
	Users, 
	Calendar,
	Clock,
	BookOpen,
	CheckCircle,
	MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types/database";
import type { SuccessResponse, PaginationMeta } from "@/lib/validations";

interface UserListProps {
	searchParams: {
		page?: string;
		limit?: string;
		role?: string;
		department?: string;
		search?: string;
		sort?: string;
		order?: string;
	};
}

interface UserWithStats extends User {
	enrollments_count?: number;
	completed_courses_count?: number;
	last_login_at?: string | null;
}

export function UserList({ searchParams }: UserListProps) {
	const [users, setUsers] = useState<UserWithStats[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [meta, setMeta] = useState<PaginationMeta | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<UserWithStats | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		fetchUsers();
	}, [searchParams]);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams();
			
			// URLSearchParamsにsearchParamsを追加
			Object.entries(searchParams).forEach(([key, value]) => {
				if (value) {
					params.append(key, value);
				}
			});

			const response = await fetch(`/api/users?${params.toString()}`);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: SuccessResponse<UserWithStats[]> = await response.json();
			
			if (data.success) {
				setUsers(data.data);
				setMeta(data.meta || null);
			} else {
				throw new Error("データの取得に失敗しました");
			}
		} catch (err) {
			console.error("ユーザー一覧取得エラー:", err);
			setError(err instanceof Error ? err.message : "データの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteUser = async (user: UserWithStats) => {
		setUserToDelete(user);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!userToDelete) return;

		try {
			setDeleting(true);
			
			const response = await fetch(`/api/users/${userToDelete.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "削除に失敗しました");
			}

			toast.success("受講者を削除しました");
			setUsers(users.filter(u => u.id !== userToDelete.id));
			setDeleteDialogOpen(false);
			setUserToDelete(null);
		} catch (err) {
			console.error("ユーザー削除エラー:", err);
			toast.error(err instanceof Error ? err.message : "削除に失敗しました");
		} finally {
			setDeleting(false);
		}
	};

	const formatLastLogin = (lastLogin: string | null) => {
		if (!lastLogin) return "未ログイン";
		
		const date = new Date(lastLogin);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) {
			return "今日";
		} else if (diffDays === 1) {
			return "昨日";
		} else if (diffDays < 7) {
			return `${diffDays}日前`;
		} else {
			return date.toLocaleDateString("ja-JP");
		}
	};

	const getRoleBadgeVariant = (role: string | null) => {
		switch (role) {
			case "admin":
				return "destructive";
			case "learner":
				return "default";
			default:
				return "secondary";
		}
	};

	const getRoleLabel = (role: string | null) => {
		switch (role) {
			case "admin":
				return "管理者";
			case "learner":
				return "受講者";
			default:
				return "未設定";
		}
	};

	const columns = [
		{
			key: "name",
			label: "名前",
			render: (user: UserWithStats) => (
				<div className="flex flex-col">
					<span className="font-medium">{user.name || user.full_name || "名前未設定"}</span>
					{user.full_name && user.name !== user.full_name && (
						<span className="text-sm text-muted-foreground">{user.full_name}</span>
					)}
				</div>
			),
		},
		{
			key: "email",
			label: "メールアドレス",
			render: (user: UserWithStats) => (
				<span className="text-sm">{user.email}</span>
			),
		},
		{
			key: "role",
			label: "役職",
			render: (user: UserWithStats) => (
				<Badge variant={getRoleBadgeVariant(user.role)}>
					{getRoleLabel(user.role)}
				</Badge>
			),
		},
		{
			key: "department",
			label: "所属部署",
			render: (user: UserWithStats) => (
				<span className="text-sm">{user.department || "未設定"}</span>
			),
		},
		{
			key: "stats",
			label: "受講状況",
			render: (user: UserWithStats) => (
				<div className="flex items-center space-x-4 text-sm">
					<div className="flex items-center space-x-1">
						<BookOpen className="h-4 w-4 text-blue-500" />
						<span>{user.enrollments_count || 0}件受講中</span>
					</div>
					<div className="flex items-center space-x-1">
						<CheckCircle className="h-4 w-4 text-green-500" />
						<span>{user.completed_courses_count || 0}件完了</span>
					</div>
				</div>
			),
		},
		{
			key: "last_login",
			label: "最終ログイン",
			render: (user: UserWithStats) => (
				<div className="flex items-center space-x-1 text-sm">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<span>{formatLastLogin(user.last_login_at)}</span>
				</div>
			),
		},
		{
			key: "actions",
			label: "操作",
			render: (user: UserWithStats) => (
				<div className="flex items-center space-x-2">
					<Button asChild variant="ghost" size="sm">
						<Link href={`/admin/users/${user.id}`}>
							<Eye className="h-4 w-4" />
							<span className="sr-only">詳細</span>
						</Link>
					</Button>
					<Button asChild variant="ghost" size="sm">
						<Link href={`/admin/users/${user.id}/edit`}>
							<Edit className="h-4 w-4" />
							<span className="sr-only">編集</span>
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleDeleteUser(user)}
						className="text-destructive hover:text-destructive"
					>
						<Trash2 className="h-4 w-4" />
						<span className="sr-only">削除</span>
					</Button>
				</div>
			),
		},
	];

	if (loading) {
		return <LoadingDisplay />;
	}

	if (error) {
		return (
			<ErrorDisplay 
				message={error}
				onRetry={fetchUsers}
			/>
		);
	}

	if (users.length === 0) {
		return (
			<EmptyState
				icon={Users}
				title="受講者が見つかりません"
				description="条件に一致する受講者がいません。フィルターを変更するか、新しい受講者を追加してください。"
				action={
					<Button asChild>
						<Link href="/admin/users/new">
							<Users className="mr-2 h-4 w-4" />
							新規受講者追加
						</Link>
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<DataTable
				columns={columns}
				data={users}
				className="border-0"
			/>

			{meta && meta.totalPages > 1 && (
				<div className="flex justify-center">
					<Pagination
						currentPage={meta.page}
						totalPages={meta.totalPages}
						baseUrl="/admin/users"
						searchParams={searchParams}
					/>
				</div>
			)}

			{/* 削除確認ダイアログ */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>受講者を削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							{userToDelete && (
								<>
									<strong>{userToDelete.name || userToDelete.email}</strong> を削除します。
									<br />
									この操作は取り消せません。関連する受講割り当てや学習記録がある場合は削除できません。
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