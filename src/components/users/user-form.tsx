"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Save, ArrowLeft, User, Mail, Building, Calendar, Shield, Key } from "lucide-react";
import { userCreateSchema, userUpdateSchema, type UserCreateSchema, type UserUpdateSchema } from "@/lib/validations";
import type { User } from "@/types/database";

interface UserFormProps {
	mode: "create" | "edit";
	user?: User;
	onSuccess?: () => void;
}

// 共通の部署・役職候補
const DEPARTMENTS = [
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

const POSITIONS = [
	"部長",
	"課長",
	"主任",
	"係長",
	"チームリーダー",
	"シニア",
	"一般",
	"アシスタント",
	"インターン",
];

export function UserForm({ mode, user, onSuccess }: UserFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);

	const isEditMode = mode === "edit";
	const schema = isEditMode ? userUpdateSchema : userCreateSchema;
	
	const form = useForm<UserCreateSchema | UserUpdateSchema>({
		resolver: zodResolver(schema),
		defaultValues: isEditMode
			? {
					name: user?.name || "",
					full_name: user?.full_name || "",
					department: user?.department || "",
					position: user?.position || "",
					role: user?.role as "admin" | "learner" || "learner",
					hire_date: user?.hire_date || "",
			  }
			: {
					email: "",
					name: "",
					full_name: "",
					department: "",
					position: "",
					role: "learner",
					hire_date: "",
					password: "",
			  },
	});

	const onSubmit = async (data: UserCreateSchema | UserUpdateSchema) => {
		try {
			setLoading(true);
			setApiError(null);

			const url = isEditMode ? `/api/users/${user?.id}` : "/api/users";
			const method = isEditMode ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "操作に失敗しました");
			}

			toast.success(
				isEditMode ? "受講者情報を更新しました" : "受講者を作成しました"
			);

			if (onSuccess) {
				onSuccess();
			} else {
				router.push("/admin/users");
			}
		} catch (error) {
			console.error("フォーム送信エラー:", error);
			const errorMessage = error instanceof Error ? error.message : "操作に失敗しました";
			setApiError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		router.back();
	};

	if (loading && isEditMode) {
		return <LoadingDisplay />;
	}

	return (
		<div className="container mx-auto p-6 max-w-2xl">
			<div className="space-y-6">
				{/* ページヘッダー */}
				<div className="flex items-center space-x-4">
					<Button variant="ghost" size="sm" onClick={handleCancel}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						戻る
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{isEditMode ? "受講者編集" : "新規受講者追加"}
						</h1>
						<p className="text-muted-foreground">
							{isEditMode 
								? "受講者の情報を編集します" 
								: "新しい受講者を追加します"
							}
						</p>
					</div>
				</div>

				{/* エラー表示 */}
				{apiError && (
					<Alert variant="destructive">
						<AlertDescription>{apiError}</AlertDescription>
					</Alert>
				)}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* 基本情報 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<User className="h-5 w-5" />
									<span>基本情報</span>
								</CardTitle>
								<CardDescription>
									受講者の基本的な情報を入力してください
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* メールアドレス（新規作成時のみ） */}
								{!isEditMode && (
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center space-x-1">
													<Mail className="h-4 w-4" />
													<span>メールアドレス</span>
													<span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														placeholder="example@company.com"
														type="email"
														{...field}
													/>
												</FormControl>
												<FormDescription>
													ログイン時に使用されるメールアドレスです
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{/* 表示名 */}
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center space-x-1">
												<span>表示名</span>
												<span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input placeholder="田中太郎" {...field} />
											</FormControl>
											<FormDescription>
												システム内で表示される名前です
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* フルネーム */}
								<FormField
									control={form.control}
									name="full_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>フルネーム</FormLabel>
											<FormControl>
												<Input placeholder="田中 太郎" {...field} />
											</FormControl>
											<FormDescription>
												正式な氏名を入力してください（任意）
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* 組織情報 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Building className="h-5 w-5" />
									<span>組織情報</span>
								</CardTitle>
								<CardDescription>
									所属部署や役職などの組織に関する情報
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* 部署 */}
								<FormField
									control={form.control}
									name="department"
									render={({ field }) => (
										<FormItem>
											<FormLabel>所属部署</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="部署を選択してください" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{DEPARTMENTS.map((dept) => (
														<SelectItem key={dept} value={dept}>
															{dept}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												所属する部署を選択してください
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* 役職 */}
								<FormField
									control={form.control}
									name="position"
									render={({ field }) => (
										<FormItem>
											<FormLabel>役職</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="役職を選択してください" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{POSITIONS.map((pos) => (
														<SelectItem key={pos} value={pos}>
															{pos}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												現在の役職を選択してください
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* 入社日 */}
								<FormField
									control={form.control}
									name="hire_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center space-x-1">
												<Calendar className="h-4 w-4" />
												<span>入社日</span>
											</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormDescription>
												入社年月日を選択してください（任意）
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* システム設定 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Shield className="h-5 w-5" />
									<span>システム設定</span>
								</CardTitle>
								<CardDescription>
									システムアクセスに関する設定
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* 権限 */}
								<FormField
									control={form.control}
									name="role"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center space-x-1">
												<span>権限</span>
												<span className="text-destructive">*</span>
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="learner">受講者</SelectItem>
													<SelectItem value="admin">管理者</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												システムでの権限レベルを選択してください
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* パスワード（新規作成時のみ） */}
								{!isEditMode && (
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center space-x-1">
													<Key className="h-4 w-4" />
													<span>初期パスワード</span>
													<span className="text-destructive">*</span>
												</FormLabel>
												<div className="relative">
													<FormControl>
														<Input
															type={showPassword ? "text" : "password"}
															placeholder="8文字以上で入力してください"
															{...field}
														/>
													</FormControl>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
														onClick={() => setShowPassword(!showPassword)}
													>
														{showPassword ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
														<span className="sr-only">
															{showPassword ? "パスワードを隠す" : "パスワードを表示"}
														</span>
													</Button>
												</div>
												<FormDescription>
													受講者の初期ログインパスワードです
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</CardContent>
						</Card>

						{/* アクションボタン */}
						<div className="flex justify-end space-x-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={loading}
							>
								キャンセル
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? (
									<>
										<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
										{isEditMode ? "更新中..." : "作成中..."}
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										{isEditMode ? "更新" : "作成"}
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
}