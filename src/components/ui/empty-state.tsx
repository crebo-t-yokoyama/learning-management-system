"use client";

import { FileX, Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: "package" | "search" | "file" | "plus";
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
	variant?: "card" | "page";
}

const iconMap = {
	package: Package,
	search: Search,
	file: FileX,
	plus: Plus,
};

export function EmptyState({
	icon = "package",
	title,
	description,
	actionLabel,
	onAction,
	className,
	variant = "card",
}: EmptyStateProps) {
	const IconComponent = iconMap[icon];

	const content = (
		<div className="text-center max-w-md mx-auto">
			<IconComponent className="h-12 w-12 text-slate-400 mx-auto mb-4" />
			<h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
			<p className="text-slate-600 mb-6">{description}</p>
			{actionLabel && onAction && (
				<Button onClick={onAction}>
					<Plus className="h-4 w-4 mr-2" />
					{actionLabel}
				</Button>
			)}
		</div>
	);

	if (variant === "page") {
		return (
			<div
				className={cn(
					"min-h-[50vh] flex items-center justify-center px-4",
					className,
				)}
			>
				{content}
			</div>
		);
	}

	// Default: card variant
	return (
		<Card className={cn("", className)}>
			<CardContent className="py-12">{content}</CardContent>
		</Card>
	);
}

// 特定用途のプリセット
export const NoItemsState = ({ onAddItem }: { onAddItem?: () => void }) => (
	<EmptyState
		icon="package"
		title="アイテムがありません"
		description="まだアイテムが登録されていません。最初のアイテムを登録してみましょう。"
		actionLabel="アイテムを登録"
		onAction={onAddItem}
	/>
);

export const NoSearchResultsState = ({
	searchTerm,
}: {
	searchTerm?: string;
}) => (
	<EmptyState
		icon="search"
		title="検索結果が見つかりません"
		description={
			searchTerm
				? `「${searchTerm}」に一致する結果が見つかりませんでした。`
				: "条件に一致する結果が見つかりませんでした。"
		}
	/>
);

export const NoDataState = () => (
	<EmptyState
		icon="file"
		title="データがありません"
		description="まだデータが登録されていません。"
	/>
);
