"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
				router.push("/dashboard");
			}
		} catch (_error) {
			setError("ログイン中にエラーが発生しました");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl text-center">ログイン</CardTitle>
				<CardTitle className="text-xl text-center text-slate-700">アプリケーション</CardTitle>
				<CardDescription className="text-center">
					認証が必要です
				</CardDescription>
				<CardDescription className="text-center">
					メールアドレスとパスワードを入力してください
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
	);
}
