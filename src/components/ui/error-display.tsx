"use client";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
	title?: string;
	message: string;
	details?: string;
	showRetry?: boolean;
	showBack?: boolean;
	onRetry?: () => void;
	onBack?: () => void;
	className?: string;
	variant?: "card" | "alert" | "page";
}

export function ErrorDisplay({
	title = "エラーが発生しました",
	message,
	details,
	showRetry = true,
	showBack = false,
	onRetry,
	onBack,
	className,
	variant = "card",
}: ErrorDisplayProps) {
	if (variant === "alert") {
		return (
			<Alert variant="destructive" className={cn("", className)}>
				<AlertCircle className="h-4 w-4" />
				<AlertDescription className="flex items-center justify-between">
					<div>
						<div className="font-medium">{message}</div>
						{details && (
							<div className="text-sm mt-1 text-muted-foreground">
								{details}
							</div>
						)}
					</div>
					{showRetry && onRetry && (
						<Button
							variant="outline"
							size="sm"
							onClick={onRetry}
							className="ml-4 shrink-0"
						>
							<RefreshCw className="h-3 w-3 mr-1" />
							再試行
						</Button>
					)}
				</AlertDescription>
			</Alert>
		);
	}

	if (variant === "page") {
		return (
			<div
				className={cn(
					"min-h-[50vh] flex items-center justify-center",
					className,
				)}
			>
				<Card className="max-w-md w-full mx-4">
					<CardContent className="pt-6 text-center">
						<AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-slate-900 mb-2">
							{title}
						</h3>
						<p className="text-slate-600 mb-4">{message}</p>
						{details && (
							<p className="text-sm text-slate-500 mb-6">{details}</p>
						)}
						<div className="flex gap-2 justify-center">
							{showBack && onBack && (
								<Button variant="outline" onClick={onBack}>
									<ArrowLeft className="h-4 w-4 mr-2" />
									戻る
								</Button>
							)}
							{showRetry && onRetry && (
								<Button onClick={onRetry}>
									<RefreshCw className="h-4 w-4 mr-2" />
									再試行
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Default: card variant
	return (
		<Card className={cn("", className)}>
			<CardContent className="flex items-center justify-center py-8 text-center">
				<div className="max-w-sm">
					<AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
					<h3 className="font-medium text-slate-900 mb-2">{title}</h3>
					<p className="text-sm text-slate-600 mb-4">{message}</p>
					{details && <p className="text-xs text-slate-500 mb-4">{details}</p>}
					<div className="flex gap-2 justify-center">
						{showBack && onBack && (
							<Button variant="outline" size="sm" onClick={onBack}>
								<ArrowLeft className="h-3 w-3 mr-1" />
								戻る
							</Button>
						)}
						{showRetry && onRetry && (
							<Button size="sm" onClick={onRetry}>
								<RefreshCw className="h-3 w-3 mr-1" />
								再試行
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
