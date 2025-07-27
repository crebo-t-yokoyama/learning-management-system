"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { itemSchema, type ItemSchema } from "@/lib/validations";

// テンプレート用のカテゴリ（実際の実装では Supabase から取得）
const CATEGORIES = [
	{ id: "electronics", name: "電子機器" },
	{ id: "books", name: "書籍" },
	{ id: "clothing", name: "衣類" },
	{ id: "other", name: "その他" },
];

export function ItemForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const form = useForm<ItemSchema>({
		resolver: zodResolver(itemSchema),
		defaultValues: {
			name: "",
			category_id: "",
			description: "",
			metadata: "",
		},
	});

	async function onSubmit(data: ItemSchema) {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/items", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "登録に失敗しました");
			}

			// 成功時はアイテム一覧ページにリダイレクト
			router.push("/items");
		} catch (error) {
			setError(error instanceof Error ? error.message : "登録中にエラーが発生しました");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="w-full" data-testid="item-form">
			<CardHeader>
				<CardTitle>新規アイテム登録</CardTitle>
				<CardDescription>
					アイテムの詳細情報を入力してください
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>アイテム名</FormLabel>
									<FormControl>
										<Input
											placeholder="アイテム名を入力"
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
							name="category_id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>カテゴリ</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="カテゴリを選択" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{CATEGORIES.map((category) => (
												<SelectItem key={category.id} value={category.id}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>説明</FormLabel>
									<FormControl>
										<Textarea
											placeholder="アイテムの説明を入力"
											rows={3}
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
							name="metadata"
							render={({ field }) => (
								<FormItem>
									<FormLabel>その他情報</FormLabel>
									<FormControl>
										<Textarea
											placeholder="その他の情報（オプション）"
											rows={3}
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{error && (
							<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
								{error}
							</div>
						)}

						<div className="flex gap-4">
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "登録中..." : "登録"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => router.push("/items")}
								disabled={isLoading}
							>
								キャンセル
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}