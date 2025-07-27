"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, RotateCcw } from "lucide-react";

interface FilterState {
	search: string;
	role: string;
	department: string;
	sort: string;
	order: string;
}

const DEFAULT_FILTERS: FilterState = {
	search: "",
	role: "",
	department: "",
	sort: "created_at",
	order: "desc",
};

// よくある部署名の候補
const COMMON_DEPARTMENTS = [
	"営業部",
	"開発部",
	"マーケティング部",
	"人事部",
	"総務部",
	"経理部",
	"企画部",
	"品質管理部",
	"システム部",
	"カスタマーサポート部",
];

export function UserFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
	const [departments, setDepartments] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		// URLパラメータから初期値を設定
		setFilters({
			search: searchParams.get("search") || "",
			role: searchParams.get("role") || "",
			department: searchParams.get("department") || "",
			sort: searchParams.get("sort") || "created_at",
			order: searchParams.get("order") || "desc",
		});

		// 部署一覧を取得
		fetchDepartments();
	}, [searchParams]);

	const fetchDepartments = async () => {
		try {
			setIsLoading(true);
			
			// 実際のユーザーから部署名を取得するAPI呼び出し
			// 今回は簡略化のため、共通部署名を使用
			const response = await fetch("/api/users?limit=1000");
			
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					const uniqueDepartments = Array.from(
						new Set(
							data.data
								.map((user: any) => user.department)
								.filter((dept: string) => dept && dept.trim() !== "")
						)
					) as string[];
					
					// 共通部署名と実際のデータから取得した部署名をマージ
					const allDepartments = Array.from(
						new Set([...COMMON_DEPARTMENTS, ...uniqueDepartments])
					).sort();
					
					setDepartments(allDepartments);
				}
			} else {
				// API呼び出しに失敗した場合は共通部署名のみ使用
				setDepartments(COMMON_DEPARTMENTS);
			}
		} catch (error) {
			console.error("部署一覧取得エラー:", error);
			setDepartments(COMMON_DEPARTMENTS);
		} finally {
			setIsLoading(false);
		}
	};

	const handleFilterChange = (key: keyof FilterState, value: string) => {
		setFilters(prev => ({
			...prev,
			[key]: value,
		}));
	};

	const applyFilters = () => {
		const params = new URLSearchParams();
		
		// 空でない値のみURLパラメータに追加
		Object.entries(filters).forEach(([key, value]) => {
			if (value && value !== DEFAULT_FILTERS[key as keyof FilterState]) {
				params.set(key, value);
			}
		});

		// ページを1にリセット
		params.set("page", "1");

		router.push(`/admin/users?${params.toString()}`);
	};

	const resetFilters = () => {
		setFilters(DEFAULT_FILTERS);
		router.push("/admin/users");
	};

	const hasActiveFilters = Object.entries(filters).some(
		([key, value]) => value !== DEFAULT_FILTERS[key as keyof FilterState]
	);

	const getActiveFilterCount = () => {
		return Object.entries(filters).filter(
			([key, value]) => 
				value && 
				value !== DEFAULT_FILTERS[key as keyof FilterState] &&
				key !== "sort" && 
				key !== "order"
		).length;
	};

	return (
		<div className="space-y-4">
			{/* フィルターフォーム */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* 検索 */}
				<div className="space-y-2">
					<Label htmlFor="search">検索</Label>
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							id="search"
							placeholder="名前、メールアドレスで検索"
							value={filters.search}
							onChange={(e) => handleFilterChange("search", e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>

				{/* 役職 */}
				<div className="space-y-2">
					<Label htmlFor="role">役職</Label>
					<Select
						value={filters.role}
						onValueChange={(value) => handleFilterChange("role", value)}
					>
						<SelectTrigger>
							<SelectValue placeholder="すべての役職" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">すべての役職</SelectItem>
							<SelectItem value="admin">管理者</SelectItem>
							<SelectItem value="learner">受講者</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* 部署 */}
				<div className="space-y-2">
					<Label htmlFor="department">部署</Label>
					<Select
						value={filters.department}
						onValueChange={(value) => handleFilterChange("department", value)}
						disabled={isLoading}
					>
						<SelectTrigger>
							<SelectValue placeholder="すべての部署" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">すべての部署</SelectItem>
							{departments.map((dept) => (
								<SelectItem key={dept} value={dept}>
									{dept}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* ソート */}
				<div className="space-y-2">
					<Label htmlFor="sort">並び順</Label>
					<div className="flex space-x-2">
						<Select
							value={filters.sort}
							onValueChange={(value) => handleFilterChange("sort", value)}
						>
							<SelectTrigger className="flex-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="created_at">作成日</SelectItem>
								<SelectItem value="name">名前</SelectItem>
								<SelectItem value="email">メールアドレス</SelectItem>
								<SelectItem value="department">部署</SelectItem>
								<SelectItem value="last_login_at">最終ログイン</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={filters.order}
							onValueChange={(value) => handleFilterChange("order", value)}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="desc">降順</SelectItem>
								<SelectItem value="asc">昇順</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* アクションボタン */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Button onClick={applyFilters} className="flex items-center space-x-2">
						<Filter className="h-4 w-4" />
						<span>フィルター適用</span>
					</Button>
					
					{hasActiveFilters && (
						<Button
							variant="outline"
							onClick={resetFilters}
							className="flex items-center space-x-2"
						>
							<RotateCcw className="h-4 w-4" />
							<span>リセット</span>
						</Button>
					)}
				</div>

				{/* アクティブフィルター表示 */}
				{hasActiveFilters && (
					<div className="flex items-center space-x-2">
						<span className="text-sm text-muted-foreground">アクティブフィルター:</span>
						<Badge variant="secondary">
							{getActiveFilterCount()} 件
						</Badge>
					</div>
				)}
			</div>

			{/* アクティブフィルターの詳細表示 */}
			{hasActiveFilters && (
				<Card className="bg-muted/50">
					<CardContent className="py-3">
						<div className="flex flex-wrap gap-2">
							{filters.search && (
								<Badge variant="outline" className="flex items-center space-x-1">
									<span>検索: {filters.search}</span>
									<button
										onClick={() => handleFilterChange("search", "")}
										className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							)}
							
							{filters.role && (
								<Badge variant="outline" className="flex items-center space-x-1">
									<span>役職: {filters.role === "admin" ? "管理者" : "受講者"}</span>
									<button
										onClick={() => handleFilterChange("role", "")}
										className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							)}
							
							{filters.department && (
								<Badge variant="outline" className="flex items-center space-x-1">
									<span>部署: {filters.department}</span>
									<button
										onClick={() => handleFilterChange("department", "")}
										className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}