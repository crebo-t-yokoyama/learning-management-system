import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EnrollmentStatus } from "@/components/users/enrollment-status";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { 
	ArrowLeft, 
	Edit, 
	Mail, 
	User, 
	Building, 
	Calendar,
	Shield,
	Clock,
	BookOpen,
	CheckCircle,
	TrendingUp
} from "lucide-react";
import type { User } from "@/types/database";

interface UserDetailPageProps {
	params: {
		id: string;
	};
}

export async function generateMetadata({ params }: UserDetailPageProps): Promise<Metadata> {
	try {
		const supabase = await createServerSupabaseClient();
		const { data: user } = await supabase
			.from("users")
			.select("name, email")
			.eq("id", params.id)
			.single();

		const userName = user?.name || user?.email || "受講者";
		
		return {
			title: `${userName}の詳細 | 学習管理システム`,
			description: `${userName}の詳細情報と受講状況を確認します`,
		};
	} catch {
		return {
			title: "受講者詳細 | 学習管理システム",
			description: "受講者の詳細情報を確認します",
		};
	}
}

async function getUserWithStats(id: string) {
	try {
		const supabase = await createServerSupabaseClient();
		
		// ユーザー基本情報を取得
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("id", id)
			.single();

		if (userError || !user) {
			return null;
		}

		// 受講統計を取得
		const { data: enrollmentStats } = await supabase
			.from("enrollments")
			.select(`
				id,
				status,
				progress_percentage,
				assigned_at,
				started_at,
				completed_at,
				courses(title, category, difficulty_level)
			`)
			.eq("learner_id", id);

		// 学習記録統計を取得
		const { data: learningStats } = await supabase
			.from("learning_records")
			.select(`
				session_duration_minutes,
				understanding_level,
				session_date
			`)
			.eq("learner_id", id);

		return {
			user,
			enrollmentStats: enrollmentStats || [],
			learningStats: learningStats || [],
		};
	} catch (error) {
		console.error("ユーザー詳細取得エラー:", error);
		return null;
	}
}

function formatDate(dateString: string | null) {
	if (!dateString) return "未設定";
	return new Date(dateString).toLocaleDateString("ja-JP");
}

function formatLastLogin(lastLogin: string | null) {
	if (!lastLogin) return "未ログイン";
	
	const date = new Date(lastLogin);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	
	if (diffDays === 0) {
		return `今日 ${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
	} else if (diffDays === 1) {
		return "昨日";
	} else if (diffDays < 7) {
		return `${diffDays}日前`;
	} else {
		return date.toLocaleDateString("ja-JP");
	}
}

function getRoleBadgeVariant(role: string | null) {
	switch (role) {
		case "admin":
			return "destructive";
		case "learner":
			return "default";
		default:
			return "secondary";
	}
}

function getRoleLabel(role: string | null) {
	switch (role) {
		case "admin":
			return "管理者";
		case "learner":
			return "受講者";
		default:
			return "未設定";
	}
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
	const result = await getUserWithStats(params.id);

	if (!result) {
		notFound();
	}

	const { user, enrollmentStats, learningStats } = result;

	// 統計計算
	const totalCourses = enrollmentStats.length;
	const completedCourses = enrollmentStats.filter(e => e.status === "completed").length;
	const inProgressCourses = enrollmentStats.filter(e => e.status === "in_progress").length;
	const totalLearningMinutes = learningStats.reduce((sum, record) => 
		sum + (record.session_duration_minutes || 0), 0
	);
	const totalLearningHours = Math.round(totalLearningMinutes / 60 * 10) / 10;
	const averageUnderstanding = learningStats.length > 0 
		? Math.round(learningStats.reduce((sum, record) => 
			sum + (record.understanding_level || 0), 0) / learningStats.length * 10) / 10
		: 0;

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* ページヘッダー */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
				<div className="flex items-center space-x-4">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/admin/users">
							<ArrowLeft className="h-4 w-4 mr-2" />
							戻る
						</Link>
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{user.name || user.full_name || "名前未設定"}
						</h1>
						<p className="text-muted-foreground">{user.email}</p>
					</div>
				</div>
				<div className="flex space-x-2">
					<Button asChild>
						<Link href={`/admin/users/${user.id}/edit`}>
							<Edit className="mr-2 h-4 w-4" />
							編集
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 基本情報 */}
				<div className="lg:col-span-1 space-y-6">
					{/* プロフィール情報 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<User className="h-5 w-5" />
								<span>基本情報</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">メールアドレス</span>
								</div>
								<p className="text-sm pl-6">{user.email}</p>
							</div>

							{user.full_name && (
								<>
									<Separator />
									<div className="space-y-3">
										<div className="flex items-center space-x-2">
											<User className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">フルネーム</span>
										</div>
										<p className="text-sm pl-6">{user.full_name}</p>
									</div>
								</>
							)}

							<Separator />
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Shield className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">権限</span>
								</div>
								<div className="pl-6">
									<Badge variant={getRoleBadgeVariant(user.role)}>
										{getRoleLabel(user.role)}
									</Badge>
								</div>
							</div>

							{user.department && (
								<>
									<Separator />
									<div className="space-y-3">
										<div className="flex items-center space-x-2">
											<Building className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">所属部署</span>
										</div>
										<p className="text-sm pl-6">{user.department}</p>
									</div>
								</>
							)}

							{user.position && (
								<>
									<Separator />
									<div className="space-y-3">
										<div className="flex items-center space-x-2">
											<TrendingUp className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">役職</span>
										</div>
										<p className="text-sm pl-6">{user.position}</p>
									</div>
								</>
							)}

							{user.hire_date && (
								<>
									<Separator />
									<div className="space-y-3">
										<div className="flex items-center space-x-2">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">入社日</span>
										</div>
										<p className="text-sm pl-6">{formatDate(user.hire_date)}</p>
									</div>
								</>
							)}

							<Separator />
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">最終ログイン</span>
								</div>
								<p className="text-sm pl-6">{formatLastLogin(user.last_login_at)}</p>
							</div>

							<Separator />
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">登録日</span>
								</div>
								<p className="text-sm pl-6">{formatDate(user.created_at)}</p>
							</div>
						</CardContent>
					</Card>

					{/* 学習統計 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<TrendingUp className="h-5 w-5" />
								<span>学習統計</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">{totalCourses}</div>
									<div className="text-sm text-muted-foreground">総コース数</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">{completedCourses}</div>
									<div className="text-sm text-muted-foreground">完了コース</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600">{inProgressCourses}</div>
									<div className="text-sm text-muted-foreground">受講中</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-purple-600">{totalLearningHours}h</div>
									<div className="text-sm text-muted-foreground">学習時間</div>
								</div>
							</div>
							
							{averageUnderstanding > 0 && (
								<>
									<Separator />
									<div className="text-center">
										<div className="text-2xl font-bold text-indigo-600">{averageUnderstanding}/5</div>
										<div className="text-sm text-muted-foreground">平均理解度</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>

				{/* 受講状況 */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<BookOpen className="h-5 w-5" />
								<span>受講状況</span>
							</CardTitle>
							<CardDescription>
								コースの受講状況と進捗を確認できます
							</CardDescription>
						</CardHeader>
						<CardContent>
							<EnrollmentStatus userId={user.id} />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}