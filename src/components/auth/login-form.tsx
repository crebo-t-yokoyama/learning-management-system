"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, BookOpen, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type LoginSchema, loginSchema } from "@/lib/validations";

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const form = useForm<LoginSchema>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: LoginSchema) {
		setIsLoading(true);
		setError(null);

		try {
			const result = await signIn("credentials", {
				email: data.email,
				password: data.password,
				redirect: false,
			});

			if (result?.error) {
				setError("メールアドレスまたはパスワードが正しくありません");
			} else if (result?.ok) {
				// セッションを取得してユーザー役割に応じてリダイレクト
				const session = await getSession();
				if (session?.user?.role) {
					const dashboardUrl = session.user.role === "admin" ? "/admin" : "/learner";
					router.push(dashboardUrl);
				} else {
					router.push("/dashboard");
				}
			}
		} catch (_error) {
			setError("ログイン中にエラーが発生しました");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<div className="flex items-center justify-center mb-2">
						<BookOpen className="h-8 w-8 text-primary" />
					</div>
					<CardTitle className="text-2xl text-center">学習進捗管理システム</CardTitle>
					<CardDescription className="text-center">
						メールアドレスとパスワードを入力してログインしてください
					</CardDescription>
				</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>メールアドレス</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="example@example.com"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>パスワード</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="パスワードを入力"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{error && (
							<div className="text-sm text-destructive text-center">
								{error}
							</div>
						)}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									ログイン中...
								</>
							) : (
								<>
									<LogIn className="mr-2 h-4 w-4" />
									ログイン
								</>
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>

		{/* デモ用のログイン情報 */}
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="text-lg flex items-center gap-2">
					<Users className="h-5 w-5" />
					デモ用アカウント
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 gap-3">
					<Alert>
						<Users className="h-4 w-4" />
						<AlertDescription>
							<div className="space-y-1">
								<div className="font-semibold">管理者アカウント</div>
								<div className="text-sm">
									Email: admin@example.com<br />
									Password: password123
								</div>
							</div>
						</AlertDescription>
					</Alert>
					<Alert>
						<BookOpen className="h-4 w-4" />
						<AlertDescription>
							<div className="space-y-1">
								<div className="font-semibold">受講者アカウント</div>
								<div className="text-sm">
									Email: learner@example.com<br />
									Password: password123
								</div>
							</div>
						</AlertDescription>
					</Alert>
				</div>
			</CardContent>
		</Card>
	</div>
	);
}
