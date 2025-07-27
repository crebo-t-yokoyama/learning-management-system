import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { UserList } from "@/components/users/user-list";
import { UserFilters } from "@/components/users/user-filters";

export const metadata: Metadata = {
	title: "受講者管理 | 学習管理システム",
	description: "受講者の管理・編集・追加を行います",
};

interface UsersPageProps {
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

export default function UsersPage({ searchParams }: UsersPageProps) {
	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* ページヘッダー */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">受講者管理</h1>
					<p className="text-muted-foreground">
						受講者の一覧表示、追加、編集、削除を行えます
					</p>
				</div>
				<div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
					<Button asChild>
						<Link href="/admin/users/new">
							<Plus className="mr-2 h-4 w-4" />
							新規受講者追加
						</Link>
					</Button>
				</div>
			</div>

			{/* フィルター・検索エリア */}
			<Card>
				<CardHeader>
					<CardTitle>フィルター・検索</CardTitle>
					<CardDescription>
						受講者を部署、役職、ログイン状況などで絞り込めます
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Suspense fallback={<LoadingDisplay />}>
						<UserFilters />
					</Suspense>
				</CardContent>
			</Card>

			{/* 受講者一覧 */}
			<Card>
				<CardHeader>
					<CardTitle>受講者一覧</CardTitle>
					<CardDescription>
						登録されている受講者の一覧です。クリックして詳細を確認できます
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Suspense fallback={<LoadingDisplay />}>
						<UserList searchParams={searchParams} />
					</Suspense>
				</CardContent>
			</Card>
		</div>
	);
}