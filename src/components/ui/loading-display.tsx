"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingDisplayProps {
	message?: string;
	className?: string;
	variant?: "card" | "inline" | "page" | "overlay";
	size?: "sm" | "md" | "lg";
}

export function LoadingDisplay({
	message = "読み込み中...",
	className,
	variant = "card",
	size = "md",
}: LoadingDisplayProps) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-6 w-6",
		lg: "h-8 w-8",
	};

	const textSizeClasses = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg",
	};

	if (variant === "inline") {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<Loader2
					className={cn("animate-spin text-slate-600", sizeClasses[size])}
				/>
				<span className={cn("text-slate-600", textSizeClasses[size])}>
					{message}
				</span>
			</div>
		);
	}

	if (variant === "overlay") {
		return (
			<div
				className={cn(
					"absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50",
					className,
				)}
			>
				<div className="text-center">
					<Loader2
						className={cn(
							"animate-spin text-slate-600 mx-auto mb-2",
							sizeClasses[size],
						)}
					/>
					<p className={cn("text-slate-600", textSizeClasses[size])}>
						{message}
					</p>
				</div>
			</div>
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
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
					<p className="text-lg text-slate-600">{message}</p>
				</div>
			</div>
		);
	}

	// Default: card variant
	return (
		<Card className={cn("", className)}>
			<CardContent className="flex items-center justify-center py-8">
				<div className="text-center">
					<Loader2
						className={cn(
							"animate-spin text-slate-600 mx-auto mb-3",
							sizeClasses[size],
						)}
					/>
					<p className={cn("text-slate-600", textSizeClasses[size])}>
						{message}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

// 便利なプリセット
export const LoadingSpinner = ({
	size = "md",
	className,
}: {
	size?: "sm" | "md" | "lg";
	className?: string;
}) => (
	<Loader2
		className={cn(
			"animate-spin",
			{
				"h-4 w-4": size === "sm",
				"h-6 w-6": size === "md",
				"h-8 w-8": size === "lg",
			},
			className,
		)}
	/>
);

export const LoadingButton = ({ children, loading, ...props }: any) => (
	<button disabled={loading} {...props}>
		{loading && <LoadingSpinner size="sm" className="mr-2" />}
		{children}
	</button>
);
